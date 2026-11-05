import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder, disbursePayPalPayout } from "@/lib/paypal";
import { debitDemoWallet, getDemoWalletBalance } from "@/lib/demo-wallet";
import { generateImpactToast } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";
import { findCauseById, updateCauseFunding } from "@/lib/causes-store";
import { Donation } from "@/lib/types";
import { runtimeDonations } from "@/lib/ledger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      causeId,
      amount,
      useDemoWallet = false,
      donorName = "Kind Supporter",
      donorId = "user_anon",
      isAgentic = false,
    } = body;

    let donationAmount = parseFloat(amount || "5.00");
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 });
    }

    // 1. Fetch cause details to get receiver email and check auto-capping
    let targetCause = findCauseById(causeId);

    try {
      const { data } = await supabaseAdmin
        .from("causes")
        .select("*")
        .eq("id", causeId)
        .single();

      if (data) {
        targetCause = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          needType: data.need_type,
          goalAmount: parseFloat(data.goal_amount),
          raisedAmount: parseFloat(data.raised_amount),
          receiverEmail: data.receiver_email,
          receiverName: data.receiver_name,
          receiverLocation: data.receiver_location,
          receiverId: data.receiver_id,
          status: data.status,
          evidenceUrls: data.evidence_urls || [],
          redactedProofUrl: data.redacted_proof_url,
          trustScore: data.trust_score,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("Could not query Supabase for cause, using local memory cause:", err);
    }

    if (!targetCause) {
      return NextResponse.json({ error: "Cause not found" }, { status: 404 });
    }

    // 2. Goal Auto-Capping Invariant: Never exceed remaining goal amount
    const remainingGoal = Math.max(0, targetCause.goalAmount - targetCause.raisedAmount);
    if (remainingGoal > 0 && donationAmount > remainingGoal) {
      donationAmount = Math.round(remainingGoal * 100) / 100;
    }

    // 3. Capture Funds (or debit Giving Allowance)
    let captureId = "WALLET_DEBIT";
    if (useDemoWallet) {
      const walletResult = debitDemoWallet(donationAmount);
      if (!walletResult.success) {
        return NextResponse.json({ error: walletResult.error }, { status: 400 });
      }
    } else if (orderId) {
      const captureResult = await capturePayPalOrder(orderId);
      captureId = captureResult.captureId;
    }

    // 4. Disburse 100% of donation to receiver via PayPal Payouts API (Hub-and-Spoke rail)
    const donationId = `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payoutResult = await disbursePayPalPayout({
      recipientEmail: targetCause.receiverEmail,
      amount: donationAmount,
      note: `Givi micro-donation for "${targetCause.title.slice(0, 60)}"`,
      senderItemId: donationId,
    });

    // 5. Synthesize Contextual Celebratory Impact Toast via Gemini AI
    const impactToastMessage = await generateImpactToast({
      causeTitle: targetCause.title,
      donorName,
      amount: donationAmount,
      category: targetCause.category,
      recipientName: targetCause.receiverName,
      location: targetCause.receiverLocation,
    });

    // 6. Record Donation & Update Raised Amount
    const fundingResult = updateCauseFunding(targetCause.id, donationAmount);
    const newRaised = fundingResult?.cause.raisedAmount || Math.round((targetCause.raisedAmount + donationAmount) * 100) / 100;
    targetCause.raisedAmount = newRaised;
    if (newRaised >= targetCause.goalAmount) {
      targetCause.status = "funded";
    }

    const donationRecord: Donation = {
      id: donationId,
      causeId: targetCause.id,
      donorId,
      donorName,
      amount: donationAmount,
      paypalOrderId: orderId || captureId,
      paypalPayoutBatchId: payoutResult.payoutBatchId,
      paypalPayoutItemId: payoutResult.payoutItemId,
      isAgentic,
      impactMessage: impactToastMessage,
      createdAt: new Date().toISOString(),
    };

    runtimeDonations.unshift(donationRecord);

    // Update Supabase if connected
    try {
      await supabaseAdmin.from("donations").insert([
        {
          id: donationRecord.id,
          cause_id: donationRecord.causeId,
          donor_id: donationRecord.donorId,
          donor_name: donationRecord.donorName,
          amount: donationRecord.amount,
          paypal_order_id: donationRecord.paypalOrderId,
          paypal_payout_batch_id: donationRecord.paypalPayoutBatchId,
          paypal_payout_item_id: donationRecord.paypalPayoutItemId,
          is_agentic: donationRecord.isAgentic,
          impact_message: donationRecord.impactMessage,
        },
      ]);

      await supabaseAdmin
        .from("causes")
        .update({
          raised_amount: newRaised,
          status: targetCause.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetCause.id);
    } catch (dbErr) {
      console.warn("Could not sync donation to Supabase:", dbErr);
    }

    return NextResponse.json({
      success: true,
      donation: donationRecord,
      payoutBatchId: payoutResult.payoutBatchId,
      impactToast: impactToastMessage,
      updatedCause: {
        id: targetCause.id,
        raisedAmount: newRaised,
        goalAmount: targetCause.goalAmount,
        status: targetCause.status,
      },
      walletBalance: getDemoWalletBalance(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment processing failed";
    console.error("Capture & Payout Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
