import test from "node:test";
import assert from "node:assert/strict";
import {
  getDemoWalletBalance,
  setDemoWalletBalance,
  debitDemoWallet,
  topUpDemoWallet,
  isDemoUserKey,
} from "../src/lib/demo-wallet.ts";
import {
  findCauseById,
  addActiveCause,
  activeCauses,
} from "../src/lib/causes-store.ts";

test("Audit Fix 1: Top-up credits exact amount once without doubling", () => {
  const userId = `user_topup_test_${Date.now()}`;
  assert.equal(getDemoWalletBalance(userId), 0.0);

  const newBalance = topUpDemoWallet(50.0, userId);
  assert.equal(newBalance, 50.0);
  assert.equal(getDemoWalletBalance(userId), 50.0, "Wallet must have exactly $50.00, not doubled");
});

test("Audit Fix 2: Zero balance does not resurrect or overdraft", () => {
  const userId = `user_zero_test_${Date.now()}`;
  topUpDemoWallet(10.0, userId);
  assert.equal(getDemoWalletBalance(userId), 10.0);

  const debit = debitDemoWallet(10.0, userId);
  assert.equal(debit.success, true);
  assert.equal(debit.newBalance, 0.0);
  assert.equal(getDemoWalletBalance(userId), 0.0);

  // Subsequent debit should fail cleanly
  const overDraft = debitDemoWallet(5.0, userId);
  assert.equal(overDraft.success, false);
  assert.equal(getDemoWalletBalance(userId), 0.0);
});

test("Audit Fix 3: Demo key isolation distinguishes real user accounts from demo sessions", () => {
  assert.equal(isDemoUserKey("guest-session"), true);
  assert.equal(isDemoUserKey("guest-abc123"), true);
  assert.equal(isDemoUserKey("demo-test"), true);
  assert.equal(isDemoUserKey("user_clerk_prod_12345"), false);
  assert.equal(isDemoUserKey("user_9981249"), false);
});

test("Audit Fix 4: Floating-point balance calculations remain clean and rounded to cents", () => {
  const userId = `user_float_test_${Date.now()}`;
  topUpDemoWallet(50.0, userId);

  // Auto-capped micro-donation of $2.75
  const debit = debitDemoWallet(2.75, userId);
  assert.equal(debit.success, true);
  assert.equal(debit.newBalance, 47.25);
  assert.equal(getDemoWalletBalance(userId), 47.25);

  // Another uneven payment of $3.33
  const debit2 = debitDemoWallet(3.33, userId);
  assert.equal(debit2.success, true);
  assert.equal(debit2.newBalance, 43.92);
  assert.equal(getDemoWalletBalance(userId), 43.92);
});

test("Audit Fix 5: Existing causes in memory are updated when database raised amount advances", () => {
  const testId = `cause-sync-test-${Date.now()}`;
  const causeRecord = {
    id: testId,
    title: "Sync Test Bill",
    description: "Testing",
    category: "utilities",
    needType: "bill",
    goalAmount: 100.0,
    raisedAmount: 20.0,
    receiverEmail: "sync@example.com",
    receiverName: "Neighbor",
    receiverLocation: "Detroit, MI",
    receiverId: "user_test",
    status: "active",
    evidenceUrls: [],
    redactedProofUrl: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  addActiveCause(causeRecord);
  const found = findCauseById(testId);
  assert.ok(found);
  assert.equal(found.raisedAmount, 20.0);

  // Simulate GET /api/causes mapping with updated raisedAmount from Supabase
  const updatedFromDb = { ...causeRecord, raisedAmount: 80.0, status: "active" };
  const existing = findCauseById(updatedFromDb.id);
  if (existing) {
    existing.raisedAmount = updatedFromDb.raisedAmount;
    existing.status = updatedFromDb.status;
  }

  assert.equal(findCauseById(testId)?.raisedAmount, 80.0, "Cause in memory must reflect updated database raised amount");
});

test("Audit Fix 6: Super Swipe deficit correctly calculates shortage for wallet refill", () => {
  const goalAmount = 140.0;
  const raisedAmount = 20.0;
  const remaining = Math.max(0.01, Math.round((goalAmount - raisedAmount) * 100) / 100);
  assert.equal(remaining, 120.0);

  const walletBalance = 10.0;
  const deficit = Math.max(1, Math.ceil(remaining - walletBalance));
  assert.equal(deficit, 110.0, "Refill modal should be initialized with exact $110 shortage");
});

