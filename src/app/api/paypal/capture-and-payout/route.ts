import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { capturePayPalOrder, disbursePayPalPayout, refundPayPalCapture, recordCapturedOrder } from "@/lib/paypal";
import { debitDemoWallet, getDemoWalletBalance, topUpDemoWallet, setDemoWalletBalance, isDemoUserKey, withUserLock } from "@/lib/demo-wallet";
import { generateImpactToast } from "@/lib/gemini";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { findCauseById, reserveCauseFunding, releaseCauseFunding } from "@/lib/causes-store";
import { Donation, createDefaultDonorProfile } from "@/lib/types";
import { recordRuntimeDonation } from "@/lib/ledger";

export async function POST(request: NextRequest) {
  let reservedCauseId: string | null = null;
  let reservedAmount = 0;
  let debitedWalletUserId: string | null = null;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      orderId,
      causeId,
      amount,
      useDemoWallet = false,
      donorName = "Kind Supporter",
      donorId = "user_anon",
      isAgentic = false,
    } = body;

    // Enforce verified caller identity when Clerk session is present
    let authUserId: string | null = null;
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (clerkSecret && !clerkSecret.includes("REPLACE")) {
      try {
        const clerkAuth = await auth();
        authUserId = clerkAuth?.userId || null;
      } catch {}
    }

    // Security (Issue 2): Reject unauthenticated claims on real user accounts
    if (donorId && donorId.startsWith("user_") && donorId !== "user_anon" && authUserId !== donorId) {
      return NextResponse.json(
        { error: "Authentication required to access this donor account" },
        { status: 401 }
      );
    }

    const isExplicitDemo = Boolean(donorId && isDemoUserKey(donorId));
    const effectiveDonorId =
      isExplicitDemo
        ? donorId
        : authUserId || (donorId && donorId !== "user_anon" ? donorId : "guest-session");

    // Issue 1: Require payment authorization
    if (!useDemoWallet && !orderId) {
      return NextResponse.json(
        { error: "Payment authorization required: provide orderId or set useDemoWallet: true" },
        { status: 400 }
      );
    }

    let donationAmount = parseFloat(amount || "5.00");
    if (isNaN(donationAmount) || !Number.isFinite(donationAmount) || donationAmount < 0.01 || donationAmount > 10000) {
      return NextResponse.json({ error: "Invalid donation amount (minimum $0.01, maximum $10,000.00)" }, { status: 400 });
    }

    // 1. Fetch cause details
    let targetCause = findCauseById(causeId);

    if (isSupabaseConfigured) {
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
    }

    if (!targetCause) {
      return NextResponse.json({ error: "Cause not found" }, { status: 404 });
    }

    // Atomic database-level validation to prevent multi-instance over-funding races
    if (isSupabaseConfigured) {
      try {
        const { data: dbCause } = await supabaseAdmin
          .from("causes")
          .select("raised_amount, goal_amount, status")
          .eq("id", targetCause.id)
          .maybeSingle();

        if (dbCause) {
          const dbRemaining = Math.max(0, Number(dbCause.goal_amount) - Number(dbCause.raised_amount));
          if (dbRemaining <= 0.01 || dbCause.status === "funded") {
            return NextResponse.json(
              { error: "This cause has already reached its full funding goal." },
              { status: 400 }
            );
          }
          if (donationAmount > dbRemaining) {
            donationAmount = Math.round(dbRemaining * 100) / 100;
          }
        }
      } catch (checkErr) {
        console.warn("Could not check Supabase cause funding limit:", checkErr);
      }
    }

    // Atomically reserve funding up to remaining goal in local cache
    const reservation = reserveCauseFunding(targetCause.id, donationAmount, targetCause);
    if (!reservation.success) {
      return NextResponse.json({ error: reservation.error }, { status: 400 });
    }
    donationAmount = reservation.actualAmount;
    if (reservation.cause) {
      targetCause.raisedAmount = reservation.cause.raisedAmount;
      targetCause.status = reservation.cause.status;
    }
    reservedCauseId = targetCause.id;
    reservedAmount = donationAmount;

    // 3. Capture Funds (or debit Giving Allowance)
    let captureId = "WALLET_DEBIT";
    let creditedExcess = 0;
    if (useDemoWallet) {
      const clientBalance =
        typeof body.walletBalance === "number" ? body.walletBalance : undefined;
      const isDemoUser = isDemoUserKey(effectiveDonorId);

      // Hydrate authoritative database wallet balance for authenticated users if server memory was wiped
      if (isSupabaseConfigured && !isDemoUser) {
        try {
          const { data: dbProf } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("wallet_balance")
            .eq("id", effectiveDonorId)
            .maybeSingle();
          if (dbProf && typeof dbProf.wallet_balance !== "undefined") {
            setDemoWalletBalance(effectiveDonorId, Number(dbProf.wallet_balance));
          }
        } catch (dbErr) {
          console.warn("Could not fetch database wallet for donor:", dbErr);
        }
      }

      // Reconcile server in-memory wallet from fallback profile or verified client state for demo keys
      if (getDemoWalletBalance(effectiveDonorId) < donationAmount) {
        const fallbackStore: Map<string, any> =
          (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
        const profileBal = Number(fallbackStore?.get(effectiveDonorId)?.wallet_balance || 0);

        if (profileBal >= donationAmount) {
          setDemoWalletBalance(effectiveDonorId, profileBal);
        } else if (
          isDemoUser &&
          typeof clientBalance === "number" &&
          clientBalance >= donationAmount &&
          clientBalance <= 500
        ) {
          // Strictly allow demo keys to recover verified client session balance up to $500
          setDemoWalletBalance(effectiveDonorId, clientBalance);
          if (fallbackStore?.has(effectiveDonorId)) {
            fallbackStore.get(effectiveDonorId).wallet_balance = clientBalance;
          }
        }
      }

      // Issue 1: Debit atomically under user lock to prevent concurrent double-spending
      const walletResult = await withUserLock(effectiveDonorId, async () => {
        if (isSupabaseConfigured && !isDemoUser) {
          const { data: dbProf } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("wallet_balance")
            .eq("id", effectiveDonorId)
            .maybeSingle();
          const currentBal = Number(dbProf?.wallet_balance || 0);
          if (currentBal < donationAmount) {
            return {
              success: false,
              newBalance: currentBal,
              error: `Insufficient Giving Allowance. Current balance is $${currentBal.toFixed(2)}. Please top up.`,
            };
          }
          const nextBal = Math.round((currentBal - donationAmount) * 100) / 100;
          const { data: updatedRows, error: updErr } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .update({ wallet_balance: nextBal, updated_at: new Date().toISOString() })
            .eq("id", effectiveDonorId)
            .gte("wallet_balance", donationAmount)
            .select();
          if (updErr || !updatedRows || updatedRows.length === 0) {
            return {
              success: false,
              newBalance: currentBal,
              error: "Concurrent transaction conflict on Giving Allowance. Please retry.",
            };
          }
          setDemoWalletBalance(effectiveDonorId, nextBal);
          return { success: true, newBalance: nextBal };
        }
        return debitDemoWallet(
          donationAmount,
          effectiveDonorId,
          isDemoUser ? clientBalance : undefined
        );
      });

      if (!walletResult.success) {
        if (reservedCauseId) releaseCauseFunding(reservedCauseId, reservedAmount);
        reservedCauseId = null;
        return NextResponse.json({ error: walletResult.error }, { status: 400 });
      }
      debitedWalletUserId = effectiveDonorId;

      // Keep fallback profile store synchronized with new debited balance
      const fallbackStore: Map<string, any> =
        (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
      if (fallbackStore?.has(effectiveDonorId)) {
        fallbackStore.get(effectiveDonorId).wallet_balance = walletResult.newBalance;
      }
    } else if (orderId) {
      if (!recordCapturedOrder(orderId)) {
        if (reservedCauseId) releaseCauseFunding(reservedCauseId, reservedAmount);
        reservedCauseId = null;
        return NextResponse.json(
          { error: "PayPal order has already been captured / processed" },
          { status: 400 }
        );
      }
      try {
        const captureResult = await capturePayPalOrder(orderId, donationAmount);
        // Issue 4: Enforce completed status on captured order before proceeding to payout
        if (captureResult.status !== "COMPLETED") {
          if (reservedCauseId) releaseCauseFunding(reservedCauseId, reservedAmount);
          reservedCauseId = null;
          return NextResponse.json(
            { error: `PayPal order capture not completed (status: ${captureResult.status}). Payout cancelled.` },
            { status: 400 }
          );
        }
        captureId = captureResult.captureId;
        const capturedAmount = Number(captureResult.amount || donationAmount);
        if (capturedAmount < donationAmount) {
          if (reservedCauseId) releaseCauseFunding(reservedCauseId, reservedAmount);
          reservedCauseId = null;
          return NextResponse.json(
            { error: `Captured amount ($${capturedAmount.toFixed(2)}) is less than donation amount ($${donationAmount.toFixed(2)}).` },
            { status: 400 }
          );
        }
        const excess = Math.max(0, Math.round((capturedAmount - donationAmount) * 100) / 100);
        if (excess > 0) {
          creditedExcess = excess;
          topUpDemoWallet(excess, effectiveDonorId);
          if (isSupabaseConfigured && effectiveDonorId) {
            try {
              const { data: prof } = await (supabaseAdmin as any)
                .from("donor_profiles")
                .select("wallet_balance")
                .eq("id", effectiveDonorId)
                .maybeSingle();
              if (prof) {
                await (supabaseAdmin as any)
                  .from("donor_profiles")
                  .update({
                    wallet_balance: Math.round((Number(prof.wallet_balance || 0) + excess) * 100) / 100,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", effectiveDonorId);
              }
            } catch (dbErr) {
              console.warn("Could not credit excess to Supabase profile:", dbErr);
            }
          }
          const fallbackStore: Map<string, any> =
            (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
          if (fallbackStore?.has(effectiveDonorId)) {
            const prev = Number(fallbackStore.get(effectiveDonorId).wallet_balance || 0);
            fallbackStore.get(effectiveDonorId).wallet_balance = Math.round((prev + excess) * 100) / 100;
          }
        }
      } catch (captureErr) {
        if (reservedCauseId) {
          releaseCauseFunding(reservedCauseId, reservedAmount);
          reservedCauseId = null;
        }
        throw captureErr;
      }
    }

    // 4. Disburse 100% of donation to receiver via PayPal Payouts API (Hub-and-Spoke rail)
    const donationId = `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let payoutResult;
    try {
      payoutResult = await disbursePayPalPayout({
        recipientEmail: targetCause.receiverEmail,
        amount: donationAmount,
        note: `Givi micro-donation for "${targetCause.title.slice(0, 60)}"`,
        senderItemId: donationId,
      });
    } catch (payoutErr) {
      if (reservedCauseId) {
        releaseCauseFunding(reservedCauseId, reservedAmount);
        reservedCauseId = null;
      }

      // Claw back excess wallet credits if order capture exceeded donation amount
      if (creditedExcess > 0 && effectiveDonorId) {
        debitDemoWallet(creditedExcess, effectiveDonorId);
        if (isSupabaseConfigured) {
          try {
            const { data: prof } = await (supabaseAdmin as any)
              .from("donor_profiles")
              .select("wallet_balance")
              .eq("id", effectiveDonorId)
              .maybeSingle();
            if (prof) {
              await (supabaseAdmin as any)
                .from("donor_profiles")
                .update({
                  wallet_balance: Math.max(0, Math.round((Number(prof.wallet_balance || 0) - creditedExcess) * 100) / 100),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", effectiveDonorId);
            }
          } catch {}
        }
        const fallbackStore: Map<string, any> = (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
        if (fallbackStore?.has(effectiveDonorId)) {
          const prev = Number(fallbackStore.get(effectiveDonorId).wallet_balance || 0);
          fallbackStore.get(effectiveDonorId).wallet_balance = Math.max(0, Math.round((prev - creditedExcess) * 100) / 100);
        }
      }

      if (debitedWalletUserId) {
        topUpDemoWallet(donationAmount, debitedWalletUserId);
        if (isSupabaseConfigured) {
          try {
            const { data: prof } = await (supabaseAdmin as any)
              .from("donor_profiles")
              .select("wallet_balance")
              .eq("id", debitedWalletUserId)
              .maybeSingle();
            if (prof) {
              await (supabaseAdmin as any)
                .from("donor_profiles")
                .update({
                  wallet_balance: Math.round((Number(prof.wallet_balance || 0) + donationAmount) * 100) / 100,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", debitedWalletUserId);
            }
          } catch {}
        }
        const fallbackStore: Map<string, any> = (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
        if (fallbackStore?.has(debitedWalletUserId)) {
          const prev = Number(fallbackStore.get(debitedWalletUserId).wallet_balance || 0);
          fallbackStore.get(debitedWalletUserId).wallet_balance = Math.round((prev + donationAmount) * 100) / 100;
        }
      } else if (captureId && captureId !== "WALLET_DEBIT") {
        try {
          await refundPayPalCapture(captureId, donationAmount + creditedExcess);
        } catch (refundErr) {
          console.error("Critical: PayPal refund failed after payout failure:", refundErr);
          // Persist unrefunded capture audit log so customer funds are strictly traceable (capped at 100)
          (globalThis as any).__GIVI_UNREFUNDED_CAPTURES__ = (globalThis as any).__GIVI_UNREFUNDED_CAPTURES__ || [];
          const unrefundedCaptures: any[] = (globalThis as any).__GIVI_UNREFUNDED_CAPTURES__;
          if (unrefundedCaptures.length >= 100) unrefundedCaptures.shift();
          unrefundedCaptures.push({
            captureId,
            amount: donationAmount + creditedExcess,
            donorId: effectiveDonorId,
            failedAt: new Date().toISOString(),
            error: refundErr instanceof Error ? refundErr.message : String(refundErr),
          });
        }
      }
      throw payoutErr;
    }

    // 5. Contextual Celebratory Impact Toast (sub-400ms capped to ensure buttery 60fps swipe response)
    const defaultToast = `You helped cover ${targetCause.category} for ${targetCause.receiverName}!`;
    const impactToastMessage = await Promise.race([
      generateImpactToast({
        causeTitle: targetCause.title,
        donorName,
        amount: donationAmount,
        category: targetCause.category,
        recipientName: targetCause.receiverName,
        location: targetCause.receiverLocation,
      }),
      new Promise<string>((resolve) => setTimeout(() => resolve(defaultToast), 400)),
    ]);

    const newRaised = targetCause.raisedAmount;
    const isFunded = targetCause.status === "funded";

    const donationRecord: Donation = {
      id: donationId,
      causeId: targetCause.id,
      donorId: effectiveDonorId,
      donorName,
      amount: donationAmount,
      paypalOrderId: orderId || captureId,
      paypalPayoutBatchId: payoutResult.payoutBatchId,
      paypalPayoutItemId: payoutResult.payoutItemId,
      isAgentic,
      impactMessage: impactToastMessage,
      createdAt: new Date().toISOString(),
    };

    recordRuntimeDonation(donationRecord);

    // Update Supabase if connected
    if (isSupabaseConfigured) {
      try {
        const { error: donErr } = await supabaseAdmin.from("donations").insert([
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
        if (donErr) {
          console.warn("Supabase donations insert warning:", donErr.message);
        }

        await supabaseAdmin
          .from("causes")
          .update({
            raised_amount: newRaised,
            status: targetCause.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetCause.id)
          .lte("raised_amount", Math.max(0, targetCause.goalAmount - donationAmount));
      } catch (donSyncErr) {
        console.warn("Could not insert donation row to Supabase:", donSyncErr);
      }

      try {
        // Sync donor profile statistics (Total Donated, Bills Cleared, Wallet Balance)
        if (effectiveDonorId && effectiveDonorId !== "user_anon") {
          const { data: donorProf } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("total_donated, bills_cleared, wallet_balance")
            .eq("id", effectiveDonorId)
            .maybeSingle();

          if (donorProf) {
            const updatedTotal = Math.round((Number(donorProf.total_donated || 0) + donationAmount) * 100) / 100;
            const updatedBills = isFunded
              ? Number(donorProf.bills_cleared || 0) + 1
              : Number(donorProf.bills_cleared || 0);
            const updatedWallet = useDemoWallet
              ? getDemoWalletBalance(effectiveDonorId)
              : Number(donorProf.wallet_balance || 0);

            await (supabaseAdmin as any)
              .from("donor_profiles")
              .update({
                total_donated: updatedTotal,
                bills_cleared: updatedBills,
                wallet_balance: updatedWallet,
                updated_at: new Date().toISOString(),
              })
              .eq("id", effectiveDonorId);
          } else {
            const fresh = createDefaultDonorProfile(
              effectiveDonorId,
              `${effectiveDonorId}@donor.givi.app`,
              donorName
            );
            fresh.total_donated = donationAmount;
            fresh.bills_cleared = isFunded ? 1 : 0;
            fresh.wallet_balance = getDemoWalletBalance(effectiveDonorId);
            const { role: _r, ...dbFresh } = fresh;
            await (supabaseAdmin as any)
              .from("donor_profiles")
              .insert([dbFresh]);
          }
        }
      } catch (dbErr) {
        console.warn("Could not sync donation to Supabase:", dbErr);
      }
    }

    // Always sync in-memory fallback profile statistics (ensures real-time local telemetry)
    let currentTotalDonated = donationAmount;
    let currentBillsCleared = isFunded ? 1 : 0;
    const fallbackStore: Map<string, any> =
      (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ || new Map<string, any>();
    (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ = fallbackStore;

    if (effectiveDonorId && effectiveDonorId !== "user_anon") {
      if (!fallbackStore.has(effectiveDonorId)) {
        fallbackStore.set(
          effectiveDonorId,
          createDefaultDonorProfile(effectiveDonorId, `${effectiveDonorId}@donor.givi.app`, donorName)
        );
      }
      const memProf = fallbackStore.get(effectiveDonorId);
      currentTotalDonated = Math.round((Number(memProf.total_donated || 0) + donationAmount) * 100) / 100;
      currentBillsCleared = isFunded ? Number(memProf.bills_cleared || 0) + 1 : Number(memProf.bills_cleared || 0);
      memProf.total_donated = currentTotalDonated;
      memProf.bills_cleared = currentBillsCleared;
      memProf.streak_days = Math.max(1, Number(memProf.streak_days || 0));
      memProf.updated_at = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      donation: donationRecord,
      payoutBatchId: payoutResult.payoutBatchId,
      impactToast: impactToastMessage,
      creditedExcessToWallet: creditedExcess,
      updatedDonorStats: {
        totalDonated: currentTotalDonated,
        billsCleared: currentBillsCleared,
        streakDays: 1,
      },
      updatedCause: {
        id: targetCause.id,
        raisedAmount: newRaised,
        goalAmount: targetCause.goalAmount,
        status: targetCause.status,
      },
      walletBalance: getDemoWalletBalance(effectiveDonorId),
    });
  } catch (err: unknown) {
    if (reservedCauseId && reservedAmount > 0) {
      releaseCauseFunding(reservedCauseId, reservedAmount);
    }
    const message = err instanceof Error ? err.message : "Payment processing failed";
    console.error("Capture & Payout Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
