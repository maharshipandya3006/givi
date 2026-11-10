import test from "node:test";
import assert from "node:assert/strict";
import { refundPayPalCapture } from "../src/lib/paypal.ts";
import { reserveCauseFunding, releaseCauseFunding, activeCauses } from "../src/lib/causes-store.ts";

test("PayPal Refund Rollback: returns completed refund confirmation for simulated capture", async () => {
  const result = await refundPayPalCapture("CAPTURE-MOCK-12345", 5.0);
  assert.equal(result.status, "COMPLETED");
  assert.ok(result.refundId.startsWith("REFUND-MOCK-"));
});

test("PayPal Refund Rollback: safely handles WALLET_DEBIT capture ids without throwing", async () => {
  const result = await refundPayPalCapture("WALLET_DEBIT", 15.0);
  assert.equal(result.status, "COMPLETED");
});

test("Payout Failure Rollback: restores exact cause funding and status on simulated payout failure", () => {
  const testCause = {
    id: "test-cause-refund",
    title: "Test Refund Cause",
    description: "Testing rollback",
    category: "utilities",
    needType: "bill",
    goalAmount: 50.0,
    raisedAmount: 45.0,
    receiverEmail: "fail-payout@test.com",
    receiverName: "Jane Doe",
    receiverLocation: "Detroit, MI",
    receiverId: "user_test",
    status: "active",
    evidenceUrls: [],
    trustScore: { overall: 90, tier: "high", factors: [], verifiedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Reserve $5 to reach full funding
  const reservation = reserveCauseFunding(testCause.id, 5.0, testCause);
  assert.equal(reservation.success, true);
  assert.equal(reservation.actualAmount, 5.0);
  assert.equal(testCause.raisedAmount, 50.0);
  assert.equal(testCause.status, "funded");

  // 2. Simulate downstream payout failure -> release funding
  releaseCauseFunding(testCause.id, 5.0);
  assert.equal(testCause.raisedAmount, 45.0);
  assert.equal(testCause.status, "active");
});

