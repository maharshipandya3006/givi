import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";
import { updateLedgerPayoutStatus, runtimeDonations } from "@/lib/ledger";
import { findCauseById } from "@/lib/causes-store";
import { topUpDemoWallet } from "@/lib/demo-wallet";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. Strict Signature Verification
    const authAlgo = request.headers.get("paypal-auth-algo") || "";
    const certUrl = request.headers.get("paypal-cert-url") || "";
    const transmissionId = request.headers.get("paypal-transmission-id") || "";
    const transmissionSig = request.headers.get("paypal-transmission-sig") || "";
    const transmissionTime = request.headers.get("paypal-transmission-time") || "";

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Reject requests with missing signature headers
    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      return NextResponse.json(
        { error: "Missing required PayPal signature headers" },
        { status: 401 }
      );
    }

    const isValid = await verifyPayPalWebhookSignature({
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookId,
      webhookEvent: event,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "PayPal signature verification failed" },
        { status: 400 }
      );
    }

    const eventType = event.event_type;
    const resource = event.resource || {};

    // 2. Process Payouts Item Events
    if (eventType === "PAYMENT.PAYOUTS-ITEM.SUCCEEDED") {
      const payoutItemId = resource.payout_item_id;
      const payoutBatchId = resource.payout_batch_id;
      const senderItemId = resource.payout_item?.sender_item_id;
      const settledAt = resource.time_processed || new Date().toISOString();

      const record = updateLedgerPayoutStatus(
        { batchId: payoutBatchId, itemId: payoutItemId, senderItemId },
        "SETTLED",
        { payoutItemId, settledAt }
      );

      if (isSupabaseConfigured && (senderItemId || payoutBatchId)) {
        try {
          const query = (supabaseAdmin as any).from("donations").update({
            settlement_status: "SETTLED",
            paypal_payout_item_id: payoutItemId,
            settled_at: settledAt,
          });
          if (senderItemId) {
            await query.eq("id", senderItemId);
          } else if (payoutBatchId) {
            await query.eq("paypal_payout_batch_id", payoutBatchId);
          }
        } catch (dbErr) {
          console.warn("Could not update Supabase donation settlement:", dbErr);
        }
      }

      return NextResponse.json({
        received: true,
        event: eventType,
        status: "SETTLED",
        payoutItemId,
        recordFound: Boolean(record),
      });
    }

    if (
      eventType === "PAYMENT.PAYOUTS-ITEM.FAILED" ||
      eventType === "PAYMENT.PAYOUTS-ITEM.BLOCKED" ||
      eventType === "PAYMENT.PAYOUTS-ITEM.CANCELED"
    ) {
      const payoutItemId = resource.payout_item_id;
      const payoutBatchId = resource.payout_batch_id;
      const senderItemId = resource.payout_item?.sender_item_id;
      const failureReason =
        resource.errors?.message || resource.transaction_status || "Payout transfer rejected by rail";

      const record = updateLedgerPayoutStatus(
        { batchId: payoutBatchId, itemId: payoutItemId, senderItemId },
        "FAILED",
        { payoutItemId, failureReason }
      );

      // Automatic recovery: Restore cause funding deficit and refund donor wallet
      const donation =
        record ||
        runtimeDonations.find(
          (d) =>
            (senderItemId && d.id === senderItemId) ||
            (payoutBatchId && d.paypalPayoutBatchId === payoutBatchId)
        );

      if (donation) {
        const donationAmount = Number(donation.amount || 0);

        // 1. Restore target cause funding
        const cause = findCauseById(donation.causeId);
        if (cause && donationAmount > 0) {
          cause.raisedAmount = Math.max(0, Math.round((cause.raisedAmount - donationAmount) * 100) / 100);
          if (cause.status === "funded") {
            cause.status = "active";
          }
          if (isSupabaseConfigured) {
            try {
              await (supabaseAdmin as any)
                .from("causes")
                .update({
                  raised_amount: cause.raisedAmount,
                  status: cause.status,
                })
                .eq("id", cause.id);
            } catch {}
          }
        }

        // 2. Refund donor wallet
        if (donation.donorId && donationAmount > 0) {
          topUpDemoWallet(donationAmount, donation.donorId);
          if (isSupabaseConfigured) {
            try {
              const { data: prof } = await (supabaseAdmin as any)
                .from("donor_profiles")
                .select("wallet_balance")
                .eq("id", donation.donorId)
                .maybeSingle();
              if (prof) {
                await (supabaseAdmin as any)
                  .from("donor_profiles")
                  .update({
                    wallet_balance: Math.round((Number(prof.wallet_balance || 0) + donationAmount) * 100) / 100,
                  })
                  .eq("id", donation.donorId);
              }
            } catch {}
          }
        }
      }

      if (isSupabaseConfigured && (senderItemId || payoutBatchId)) {
        try {
          const query = (supabaseAdmin as any).from("donations").update({
            settlement_status: "FAILED",
            failure_reason: failureReason,
          });
          if (senderItemId) {
            await query.eq("id", senderItemId);
          } else if (payoutBatchId) {
            await query.eq("paypal_payout_batch_id", payoutBatchId);
          }
        } catch {}
      }

      return NextResponse.json({
        received: true,
        event: eventType,
        status: "FAILED",
        recovered: Boolean(donation),
      });
    }

    // 3. Process Batch & Order Events
    if (eventType === "PAYMENT.PAYOUTSBATCH.SUCCESS") {
      const batchId = resource.batch_header?.payout_batch_id;
      if (batchId) {
        updateLedgerPayoutStatus({ batchId }, "SETTLED");
      }
      return NextResponse.json({ received: true, event: eventType, batchId });
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
      return NextResponse.json({
        received: true,
        event: eventType,
        orderId: resource.id,
      });
    }

    return NextResponse.json({ received: true, event: eventType, unhandled: false });
  } catch (err: any) {
    console.error("PayPal Webhook processing error:", err);
    return NextResponse.json({ error: "Internal webhook error", details: err?.message }, { status: 500 });
  }
}

