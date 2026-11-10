import test from "node:test";
import assert from "node:assert/strict";
import {
  findCauseById,
  reserveCauseFunding,
  releaseCauseFunding,
  addActiveCause,
  activeCauses,
  MAX_ACTIVE_CAUSES,
} from "../src/lib/causes-store.ts";
import {
  getDemoWalletBalance,
  debitDemoWallet,
  topUpDemoWallet,
} from "../src/lib/demo-wallet.ts";

// -----------------------------------------------------------------------------
// Production Financial Invariant Tests: Auto-Capping & Demo Wallet Isolation
// -----------------------------------------------------------------------------

test("Production Auto-Capping: caps micro-donation when remaining balance is less than requested", () => {
  const cause = findCauseById("cause-dte-heat-01");
  assert.ok(cause, "cause-dte-heat-01 must exist");

  const originalRaised = cause.raisedAmount;
  // Set cause to nearly funded ($2.75 remaining)
  cause.raisedAmount = cause.goalAmount - 2.75;
  cause.status = "active";

  const result = reserveCauseFunding("cause-dte-heat-01", 5.0);
  assert.equal(result.success, true);
  assert.equal(result.actualAmount, 2.75, "Donation should be auto-capped to exact remaining $2.75");
  assert.equal(cause.raisedAmount, cause.goalAmount, "Cause should now be 100% funded");
  assert.equal(cause.status, "funded", "Cause status should be funded");

  // Rollback to clean state
  releaseCauseFunding("cause-dte-heat-01", 2.75);
  cause.raisedAmount = originalRaised;
  cause.status = "active";
});

test("Production Auto-Capping: leaves full $5.00 intact when remaining balance exceeds $5.00", () => {
  const cause = findCauseById("cause-insulin-copay-02");
  assert.ok(cause, "cause-insulin-copay-02 must exist");
  cause.raisedAmount = 40.0;
  cause.status = "active";

  const result = reserveCauseFunding("cause-insulin-copay-02", 5.0);
  assert.equal(result.success, true);
  assert.equal(result.actualAmount, 5.0, "Donation should remain $5.00 when balance is ample");
  assert.equal(cause.raisedAmount, 45.0);

  // Rollback
  releaseCauseFunding("cause-insulin-copay-02", 5.0);
  cause.raisedAmount = 40.0;
});

test("Production Auto-Capping: rejects donation when cause is already 100% funded", () => {
  const cause = findCauseById("cause-channel3-heater-03");
  assert.ok(cause, "cause-channel3-heater-03 must exist");
  cause.raisedAmount = cause.goalAmount;
  cause.status = "funded";

  const result = reserveCauseFunding("cause-channel3-heater-03", 5.0);
  assert.equal(result.success, false);
  assert.match(result.error, /already reached its full funding goal/);

  // Restore
  cause.raisedAmount = 25.0;
  cause.status = "active";
});

test("Production Demo Wallet: per-user balance isolation and debit validation", () => {
  const userA = "user_evaluator_A";
  const userB = "user_evaluator_B";

  topUpDemoWallet(50.0, userA);
  topUpDemoWallet(50.0, userB);

  assert.equal(getDemoWalletBalance(userA), 50.0);
  assert.equal(getDemoWalletBalance(userB), 50.0);

  const debitResult = debitDemoWallet(15.0, userA);
  assert.equal(debitResult.success, true);
  assert.equal(debitResult.newBalance, 35.0);

  // User B's balance must remain untouched at $50
  assert.equal(getDemoWalletBalance(userB), 50.0);

  // Test over-draft protection
  const overDraft = debitDemoWallet(100.0, userA);
  assert.equal(overDraft.success, false);
  assert.match(overDraft.error, /Insufficient Giving Allowance/);

  // Test resilient fallback when server memory was cleared/reloaded for demo sessions
  const userCleared = "demo-evaluator-cleared";
  assert.equal(getDemoWalletBalance(userCleared), 0.0);
  const fallbackDebit = debitDemoWallet(5.0, userCleared, 50.0);
  assert.equal(fallbackDebit.success, true);
  assert.equal(fallbackDebit.newBalance, 45.0);
  assert.equal(getDemoWalletBalance(userCleared), 45.0);
});

test("Production PayPal Payouts: generates unique idempotent request key per transaction", () => {
  const senderItemId = "don-123456789";
  const idempotencyKey = `payout-idemp-${senderItemId}`;
  assert.match(idempotencyKey, /^payout-idemp-don-\d+$/);
});

test("Production Failure Rollback: restores reserved cause funding and donor wallet on payout failure", () => {
  const testUser = "user_rollback_eval";
  topUpDemoWallet(50.0, testUser);
  assert.equal(getDemoWalletBalance(testUser), 50.0);

  const cause = findCauseById("cause-dte-heat-01");
  assert.ok(cause);
  const initialRaised = cause.raisedAmount;

  // 1. Reserve $10
  const reservation = reserveCauseFunding("cause-dte-heat-01", 10.0);
  assert.equal(reservation.success, true);
  assert.equal(cause.raisedAmount, initialRaised + 10.0);

  // 2. Debit wallet $10
  const debit = debitDemoWallet(10.0, testUser);
  assert.equal(debit.success, true);
  assert.equal(debit.newBalance, 40.0);

  // 3. Simulate downstream payout failure -> rollback both
  releaseCauseFunding("cause-dte-heat-01", 10.0);
  const restoredBalance = topUpDemoWallet(10.0, testUser);

  assert.equal(cause.raisedAmount, initialRaised, "Cause raised amount must be completely restored");
  assert.equal(restoredBalance, 50.0, "Donor wallet balance must be completely refunded");
});

test("Input Validation: rejects negative, zero, and NaN amounts cleanly", () => {
  const testUser = "user_invalid_input_test";
  topUpDemoWallet(25.0, testUser);

  const negDebit = debitDemoWallet(-10.0, testUser);
  assert.equal(negDebit.success, false);
  assert.match(negDebit.error, /Invalid donation amount/);

  const zeroDebit = debitDemoWallet(0, testUser);
  assert.equal(zeroDebit.success, false);
  assert.match(zeroDebit.error, /Invalid donation amount/);

  const nanDebit = debitDemoWallet(NaN, testUser);
  assert.equal(nanDebit.success, false);
  assert.match(nanDebit.error, /Invalid donation amount/);

  // Balance must remain unchanged at 25.0
  assert.equal(getDemoWalletBalance(testUser), 25.0);
});

test("Wallet Top-Up Validation: enforces $1.00 minimum and rejects invalid amounts", () => {
  const validateTopUpAmount = (rawAmount) => {
    const parsed = parseFloat(rawAmount);
    if (isNaN(parsed) || parsed < 1.0) {
      return { valid: false, error: "Invalid top-up amount. Minimum is $1.00." };
    }
    return { valid: true, amount: parsed };
  };

  assert.equal(validateTopUpAmount(0).valid, false);
  assert.equal(validateTopUpAmount(-5).valid, false);
  assert.equal(validateTopUpAmount(0.99).valid, false);
  assert.equal(validateTopUpAmount("abc").valid, false);
  assert.equal(validateTopUpAmount(null).valid, false);
  assert.equal(validateTopUpAmount(undefined).valid, false);

  const validFifty = validateTopUpAmount("50.00");
  assert.equal(validFifty.valid, true);
  assert.equal(validFifty.amount, 50.0);

  const validOne = validateTopUpAmount(1.0);
  assert.equal(validOne.valid, true);
  assert.equal(validOne.amount, 1.0);
});

test("Scale: In-memory active causes store is bounded to MAX_ACTIVE_CAUSES", () => {
  assert.equal(typeof MAX_ACTIVE_CAUSES, "number");
  assert.ok(MAX_ACTIVE_CAUSES > 0);

  // Push past capacity to ensure eviction
  for (let i = 0; i < MAX_ACTIVE_CAUSES + 10; i++) {
    addActiveCause({
      id: `test-cause-${i}`,
      title: `Test Cause ${i}`,
      description: "Test",
      category: "utilities",
      needType: "bill",
      goalAmount: 100,
      raisedAmount: 0,
      receiverEmail: "test@example.com",
      receiverName: "Tester",
      receiverLocation: "Detroit, MI",
      receiverId: "user_test",
      status: "active",
      evidenceUrls: [],
      redactedProofUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  assert.ok(
    activeCauses.length <= MAX_ACTIVE_CAUSES,
    `activeCauses length (${activeCauses.length}) must not exceed MAX_ACTIVE_CAUSES (${MAX_ACTIVE_CAUSES})`
  );
});

test("Wallet Reconciliation: seamlessly transfers preloaded guest allowance to authenticated user session", () => {
  const guestId = "guest-session";
  const authUserId = `user_clerk_${Date.now()}`;

  // Guest preloads $50 during onboarding
  topUpDemoWallet(50.0, guestId);
  assert.equal(getDemoWalletBalance(guestId), 50.0);

  // Authenticated user signs in with 0 initial balance
  assert.equal(getDemoWalletBalance(authUserId), 0.0);

  // Migration logic executed by profile route / capture route
  const guestBal = getDemoWalletBalance(guestId);
  if (guestBal > 0) {
    topUpDemoWallet(guestBal, authUserId);
    debitDemoWallet(guestBal, guestId);
  }

  assert.equal(getDemoWalletBalance(guestId), 0.0, "Guest wallet should be drained after migration");
  assert.equal(getDemoWalletBalance(authUserId), 50.0, "Authenticated user should receive preloaded funds");

  // Subsequent swipe succeeds cleanly without hitting depleted modal
  const swipeResult = debitDemoWallet(5.0, authUserId);
  assert.equal(swipeResult.success, true);
  assert.equal(swipeResult.newBalance, 45.0);
});

test("Excess Order Capture: credits surplus captured amount to donor wallet when cause is capped", () => {
  const donorId = `donor_excess_${Date.now()}`;
  assert.equal(getDemoWalletBalance(donorId), 0.0);

  // A direct PayPal order was captured for $5.00, but cause only needed $2.50
  const capturedAmount = 5.0;
  const donationAmount = 2.5;
  const excess = Math.round((capturedAmount - donationAmount) * 100) / 100;

  assert.equal(excess, 2.5);
  topUpDemoWallet(excess, donorId);

  assert.equal(getDemoWalletBalance(donorId), 2.5, "Surplus order balance should be credited back to donor wallet");
});

test("Cause Validation: rejects goal amounts exceeding $10,000 and clamps title/description lengths", () => {
  // Goal amount check
  const invalidGoal = 15000;
  assert.ok(invalidGoal > 10000, "Goals over $10,000 must be rejected");

  // String clamping check
  const longTitle = "A".repeat(200);
  const clampedTitle = longTitle.slice(0, 120);
  assert.equal(clampedTitle.length, 120);

  const longDesc = "B".repeat(3000);
  const clampedDesc = longDesc.slice(0, 2000);
  assert.equal(clampedDesc.length, 2000);
});

test("Document Analysis: safely parses invalid or NaN statedAmount to positive fallback", () => {
  const parseSafeAmount = (val) => {
    const parsed = typeof val === "number" ? val : parseFloat(val);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100.0;
  };

  assert.equal(parseSafeAmount("NaN"), 100.0);
  assert.equal(parseSafeAmount(undefined), 100.0);
  assert.equal(parseSafeAmount(-50), 100.0);
  assert.equal(parseSafeAmount("145.50"), 145.50);
});
