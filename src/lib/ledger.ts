import type { Donation, TransparencyRecord } from "./types.ts";

export const HISTORICAL_AUDIT_LOGS: TransparencyRecord[] = [
  {
    id: "tx-dte-9912",
    timestamp: "2026-11-04T18:20:12Z",
    causeId: "cause-dte-heat-01",
    causeTitle: "DTE Energy Overdue Heat Bill",
    category: "utilities",
    donorName: "Maya Lin",
    amount: 5.0,
    paypalPayoutBatchId: "BATCH-SANDBOX-782194-DTE",
    receiverLocation: "Detroit, MI",
    receiverEmail: "givibeneficiary@business.example.com",
    trustScore: 96,
    isAgentic: false,
  },
  {
    id: "tx-insulin-8812",
    timestamp: "2026-11-04T17:45:00Z",
    causeId: "cause-insulin-copay-02",
    causeTitle: "Walgreens Pharmacy 30-Day Insulin Copay",
    category: "medical",
    donorName: "Maya Lin's givi agent",
    amount: 15.0,
    paypalPayoutBatchId: "BATCH-SANDBOX-662190-RX",
    receiverLocation: "Atlanta, GA",
    receiverEmail: "givibeneficiary@business.example.com",
    trustScore: 94,
    isAgentic: true,
  },
  {
    id: "tx-heater-7714",
    timestamp: "2026-11-04T16:10:44Z",
    causeId: "cause-channel3-heater-03",
    causeTitle: "Honeywell Ceramic Digital Space Heater",
    category: "utilities",
    donorName: "Devon Clark",
    amount: 5.0,
    paypalPayoutBatchId: "BATCH-SANDBOX-551982-CH3",
    receiverLocation: "Cleveland, OH",
    receiverEmail: "givibeneficiary@business.example.com",
    trustScore: 92,
    isAgentic: false,
  },
  {
    id: "tx-formula-6612",
    timestamp: "2026-11-04T15:02:18Z",
    causeId: "cause-channel3-formula-04",
    causeTitle: "Similac Advance Infant Formula (6-Pack)",
    category: "food",
    donorName: "Elena Rostova",
    amount: 25.0,
    paypalPayoutBatchId: "BATCH-SANDBOX-441029-WMT",
    receiverLocation: "Chicago, IL",
    receiverEmail: "givibeneficiary@business.example.com",
    trustScore: 95,
    isAgentic: false,
  },
  {
    id: "tx-water-5510",
    timestamp: "2026-11-04T13:40:00Z",
    causeId: "cause-water-bill-05",
    causeTitle: "City of Philadelphia Overdue Water Bill",
    category: "utilities",
    donorName: "Elena Rostova's givi agent",
    amount: 20.0,
    paypalPayoutBatchId: "BATCH-SANDBOX-339102-PWD",
    receiverLocation: "Philadelphia, PA",
    receiverEmail: "givibeneficiary@business.example.com",
    trustScore: 91,
    isAgentic: true,
  },
  {
    id: "tx-school-4411",
    timestamp: "2026-11-04T11:22:30Z",
    causeId: "cause-school-supplies-06",
    causeTitle: "AP Chemistry Lab Manual & TI-84 Calculator",
    category: "education",
    donorName: "Liam Vance",
    amount: 10.0,
    paypalPayoutBatchId: "BATCH-SANDBOX-228190-EDU",
    receiverLocation: "Houston, TX",
    receiverEmail: "givibeneficiary@business.example.com",
    trustScore: 90,
    isAgentic: false,
  },
];

// In-memory runtime donation ledger for demo sessions & AG Grid audit (pinned to globalThis)
export const MAX_RUNTIME_DONATIONS = 100;
const globalLedger: Donation[] =
  (globalThis as any).__GIVI_RUNTIME_DONATIONS__ || [];
(globalThis as any).__GIVI_RUNTIME_DONATIONS__ = globalLedger;

export const runtimeDonations: Donation[] = globalLedger;

export function recordRuntimeDonation(donation: Donation): void {
  // Prevent duplicate insertion if already recorded by ID or PayPal Payout Batch ID
  const isDuplicate = runtimeDonations.some(
    (d) =>
      d.id === donation.id ||
      (d.paypalPayoutBatchId &&
        donation.paypalPayoutBatchId &&
        d.paypalPayoutBatchId === donation.paypalPayoutBatchId)
  );
  if (isDuplicate) return;

  runtimeDonations.unshift(donation);
  if (runtimeDonations.length > MAX_RUNTIME_DONATIONS) {
    runtimeDonations.pop();
  }
}

/**
 * Formats donor name for the transparency ledger:
 * Human swipe: "<Donor Name>"
 * Agentic donation: "<Donor Name>'s givi agent"
 */
export function formatLedgerDonorName(rawName?: string, isAgentic?: boolean): string {
  const base = (rawName || "Kind Supporter").trim();
  if (!isAgentic) return base;

  const lower = base.toLowerCase();
  if (lower.includes("givi agent")) {
    return base;
  }
  if (lower === "autonomous giving agent" || lower === "autonomous donor") {
    return "Kind Supporter's givi agent";
  }

  return base.endsWith("s")
    ? `${base}' givi agent`
    : `${base}'s givi agent`;
}

/**
 * Updates the settlement status of a donation in the runtime ledger and historical logs.
 */
export function updateLedgerPayoutStatus(
  identifier: { batchId?: string; itemId?: string; senderItemId?: string },
  status: "SETTLED" | "FAILED" | "PENDING",
  details?: { payoutItemId?: string; failureReason?: string; settledAt?: string }
): Donation | TransparencyRecord | null {
  // 1. Search runtime donations
  const donation = runtimeDonations.find(
    (d) =>
      (identifier.senderItemId && d.id === identifier.senderItemId) ||
      (identifier.batchId && d.paypalPayoutBatchId === identifier.batchId) ||
      (identifier.itemId && d.paypalPayoutItemId === identifier.itemId)
  );

  if (donation) {
    donation.settlementStatus = status;
    if (details?.payoutItemId) donation.paypalPayoutItemId = details.payoutItemId;
    if (details?.settledAt) donation.settledAt = details.settledAt;
    if (details?.failureReason) donation.failureReason = details.failureReason;
    return donation;
  }

  // 2. Search historical logs
  const historical = HISTORICAL_AUDIT_LOGS.find(
    (h) =>
      (identifier.senderItemId && h.id === identifier.senderItemId) ||
      (identifier.batchId && h.paypalPayoutBatchId === identifier.batchId)
  );

  if (historical) {
    historical.settlementStatus = status;
    if (details?.payoutItemId) historical.paypalPayoutItemId = details.payoutItemId;
    if (details?.settledAt) historical.settledAt = details.settledAt;
    return historical;
  }

  return null;
}
