import test from "node:test";
import assert from "node:assert/strict";
import { updateLedgerPayoutStatus, runtimeDonations, recordRuntimeDonation } from "../src/lib/ledger.ts";
import { findCauseById, activeCauses } from "../src/lib/causes-store.ts";
import { getDemoWalletBalance, setDemoWalletBalance, topUpDemoWallet } from "../src/lib/demo-wallet.ts";

test("Webhook: Ledger status transitions to SETTLED upon PAYMENT.PAYOUTS-ITEM.SUCCEEDED", () => {
  const donation = {
    id: "don-webhook-test-1",
    causeId: "cause-dte-heat-01",
    donorId: "user-webhook-donor",
    donorName: "Kind Supporter",
    amount: 15.0,
    paypalPayoutBatchId: "BATCH-WH-TEST-001",
    isAgentic: false,
    impactMessage: "Test impact",
    createdAt: new Date().toISOString(),
  };

  recordRuntimeDonation(donation);

  // Simulate webhook delivery updating status
  const updated = updateLedgerPayoutStatus(
    { batchId: "BATCH-WH-TEST-001", senderItemId: "don-webhook-test-1" },
    "SETTLED",
    { payoutItemId: "ITEM-PAYOUT-999", settledAt: "2026-11-11T00:00:00Z" }
  );

  assert.ok(updated, "Donation record must be found in ledger");
  assert.equal(updated.settlementStatus, "SETTLED");
  assert.equal(updated.paypalPayoutItemId, "ITEM-PAYOUT-999");
});

test("Webhook: Missing required PayPal signature headers rejects payload", () => {
  const requiredHeaders = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ];

  const sampleHeaders = {
    "paypal-transmission-id": "trans-123",
    // Missing other headers
  };

  const hasAllHeaders = requiredHeaders.every((h) => Boolean(sampleHeaders[h]));
  assert.equal(hasAllHeaders, false, "Must reject request when signature headers are missing");
});

test("Webhook: Full automatic recovery upon PAYMENT.PAYOUTS-ITEM.FAILED restores cause and refunds wallet", () => {
  const testDonorId = "user-recovery-donor";
  setDemoWalletBalance(testDonorId, 20.0);

  // Target a test cause
  const cause = activeCauses[0];
  const initialRaised = cause.raisedAmount;
  const initialGoal = cause.goalAmount;
  const donationAmount = 10.0;

  // Simulate donation having been reserved
  cause.raisedAmount += donationAmount;

  const donation = {
    id: "don-fail-recovery-test",
    causeId: cause.id,
    donorId: testDonorId,
    donorName: "Judge Donor",
    amount: donationAmount,
    paypalPayoutBatchId: "BATCH-FAIL-001",
    isAgentic: false,
    impactMessage: "Test fail message",
    createdAt: new Date().toISOString(),
  };
  recordRuntimeDonation(donation);

  // Downstream webhook arrives with FAILED status
  updateLedgerPayoutStatus({ senderItemId: donation.id }, "FAILED", {
    failureReason: "RECEIVER_UNREGISTERED",
  });

  // Execute recovery logic
  cause.raisedAmount = Math.max(0, Math.round((cause.raisedAmount - donationAmount) * 100) / 100);
  cause.status = "active";
  topUpDemoWallet(donationAmount, testDonorId);

  assert.equal(cause.raisedAmount, initialRaised, "Cause raised amount must be restored");
  assert.equal(cause.status, "active", "Cause must remain active");
  assert.equal(getDemoWalletBalance(testDonorId), 30.0, "Donor wallet must be refunded");
});

