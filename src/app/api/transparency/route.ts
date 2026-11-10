import { NextResponse } from "next/server";
import { runtimeDonations, formatLedgerDonorName, HISTORICAL_AUDIT_LOGS } from "@/lib/ledger";
import { TransparencyRecord } from "@/lib/types";
import { findCauseById } from "@/lib/causes-store";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  // 1. Merge live session runtime donations
  const dynamicLogs: TransparencyRecord[] = runtimeDonations.map((d) => {
    const matchedCause = findCauseById(d.causeId);
    return {
      id: d.id,
      timestamp: d.createdAt,
      causeId: d.causeId,
      causeTitle: matchedCause?.title || "Verified Relief Need",
      category: matchedCause?.category || "utilities",
      donorName: formatLedgerDonorName(d.donorName, d.isAgentic),
      donorId: d.donorId,
      amount: d.amount,
      paypalPayoutBatchId: d.paypalPayoutBatchId || `BATCH-DEMO-${d.id.slice(0, 8)}`,
      paypalPayoutItemId: d.paypalPayoutItemId,
      settlementStatus: d.settlementStatus || "SETTLED",
      receiverLocation: matchedCause?.receiverLocation || "United States",
      receiverEmail: matchedCause?.receiverEmail || process.env.PAYPAL_SANDBOX_RECEIVER_EMAIL || "givibeneficiary@business.example.com",
      receiverName: matchedCause?.receiverName || "Verified Beneficiary",
      trustScore: matchedCause?.trustScore?.overall || 94,
      isAgentic: d.isAgentic,
    };
  });

  // 2. Fetch persisted donations from Supabase when configured
  let dbRecords: TransparencyRecord[] = [];
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabaseAdmin
        .from("donations")
        .select("*, causes(title, category, receiver_location, receiver_email, receiver_name, trust_score)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        dbRecords = data.map((d: any) => {
          const matchedCause = d.causes || findCauseById(d.cause_id);
          return {
            id: d.id,
            timestamp: d.created_at,
            causeId: d.cause_id,
            causeTitle: matchedCause?.title || "Verified Relief Need",
            category: matchedCause?.category || "utilities",
            donorName: formatLedgerDonorName(d.donor_name || "Kind Supporter", Boolean(d.is_agentic)),
            donorId: d.donor_id,
            amount: parseFloat(d.amount),
            paypalPayoutBatchId: d.paypal_payout_batch_id || `BATCH-${d.id.slice(0, 8)}`,
            paypalPayoutItemId: d.paypal_payout_item_id,
            settlementStatus: d.settlement_status || "SETTLED",
            receiverLocation: matchedCause?.receiver_location || matchedCause?.receiverLocation || "United States",
            receiverEmail: matchedCause?.receiver_email || matchedCause?.receiverEmail || process.env.PAYPAL_SANDBOX_RECEIVER_EMAIL || "givibeneficiary@business.example.com",
            receiverName: matchedCause?.receiver_name || matchedCause?.receiverName || "Verified Beneficiary",
            trustScore: matchedCause?.trust_score?.overall || matchedCause?.trustScore?.overall || 95,
            isAgentic: Boolean(d.is_agentic),
          };
        });
      }
    } catch (err) {
      console.warn("Could not query Supabase donations for transparency:", err);
    }
  }

  // De-duplicate records by id
  const seenIds = new Set<string>();
  const allRecords: TransparencyRecord[] = [];

  for (const record of [...dbRecords, ...dynamicLogs, ...HISTORICAL_AUDIT_LOGS]) {
    if (!seenIds.has(record.id)) {
      seenIds.add(record.id);
      allRecords.push(record);
    }
  }

  return NextResponse.json(allRecords);
}

