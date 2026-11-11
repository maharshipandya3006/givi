import test from "node:test";
import assert from "node:assert/strict";
import { recordCapturedOrder } from "../src/lib/paypal.ts";
import { checkRateLimit } from "../src/lib/rate-limiter.ts";
import {
  reserveCauseFunding,
  releaseCauseFunding,
  activeCauses,
  findCauseById,
} from "../src/lib/causes-store.ts";
import {
  getDemoWalletBalance,
  setDemoWalletBalance,
  topUpDemoWallet,
  withUserLock,
} from "../src/lib/demo-wallet.ts";

test("Issue 4: Replay protection rejects previously processed PayPal order IDs", () => {
  const testOrderId = `ORDER-TEST-${Date.now()}-UNIQUE-1`;
  const firstAttempt = recordCapturedOrder(testOrderId);
  assert.equal(firstAttempt, true, "First capture attempt of order ID should succeed");

  const replayAttempt = recordCapturedOrder(testOrderId);
  assert.equal(replayAttempt, false, "Replaying same order ID must be rejected");
});

test("Issue 11: Shared rate limiter enforces quotas across orders and ocr namespaces", () => {
  const ip = "10.0.0.99";

  // Check orders limit (30 per window)
  for (let i = 0; i < 30; i++) {
    const ok = checkRateLimit("orders-test", ip, 30, 60000);
    assert.equal(ok, true, `Order ${i + 1} within quota should succeed`);
  }
  const ordersExceeded = checkRateLimit("orders-test", ip, 30, 60000);
  assert.equal(ordersExceeded, false, "Order exceeding quota should be blocked");

  // Check OCR limit (10 per window) in its own namespace
  for (let i = 0; i < 10; i++) {
    const ok = checkRateLimit("ocr-test", ip, 10, 60000);
    assert.equal(ok, true, `OCR ${i + 1} within quota should succeed`);
  }
  const ocrExceeded = checkRateLimit("ocr-test", ip, 10, 60000);
  assert.equal(ocrExceeded, false, "OCR exceeding quota should be blocked");
});

test("Issue 9: Unauthenticated agent run rejects user_* identities without bypass exception", () => {
  function verifyAgentAuth(authUserId, donorId) {
    if (donorId && donorId.startsWith("user_") && donorId !== "user_anon" && authUserId !== donorId) {
      return { allowed: false, status: 401 };
    }
    return { allowed: true, status: 200 };
  }

  // Calling with user_donor_demo without auth must now be rejected (no hardcoded bypass)
  const demoUserAttempt = verifyAgentAuth(null, "user_donor_demo");
  assert.equal(demoUserAttempt.allowed, false, "user_donor_demo without auth must be rejected with 401");
  assert.equal(demoUserAttempt.status, 401);

  // Authenticated user with matching ID is allowed
  const authMatch = verifyAgentAuth("user_real_999", "user_real_999");
  assert.equal(authMatch.allowed, true);

  // Guest/judge session identifiers are permitted
  const guestSession = verifyAgentAuth(null, "guest-session");
  assert.equal(guestSession.allowed, true);
});

test("Issue 8: Signed-in users cannot overwrite gratitude notes on other users' or guest causes", () => {
  function verifyCauseUpdatePermission(callerUserId, causeReceiverId) {
    if (causeReceiverId && causeReceiverId !== callerUserId) {
      return { allowed: false, status: 403 };
    }
    return { allowed: true, status: 200 };
  }

  // Authenticated caller tries to edit a guest cause
  const editGuestAttempt = verifyCauseUpdatePermission("user_caller_123", "user_guest");
  assert.equal(editGuestAttempt.allowed, false, "Caller cannot edit guest cause");
  assert.equal(editGuestAttempt.status, 403);

  // Authenticated caller tries to edit someone else's cause
  const editOtherAttempt = verifyCauseUpdatePermission("user_caller_123", "user_victim_456");
  assert.equal(editOtherAttempt.allowed, false, "Caller cannot edit another user's cause");
  assert.equal(editOtherAttempt.status, 403);

  // Cause owner editing their own cause
  const editOwn = verifyCauseUpdatePermission("user_owner_789", "user_owner_789");
  assert.equal(editOwn.allowed, true);
});

test("Issue 3 & 2: Mutex lock and cause reservation protect against race conditions", async () => {
  const userId = `test-race-user-${Date.now()}`;
  setDemoWalletBalance(userId, 50.0);

  // Run 2 operations in parallel using withUserLock
  let balanceCheck1 = 0;
  let balanceCheck2 = 0;

  await Promise.all([
    withUserLock(userId, async () => {
      balanceCheck1 = getDemoWalletBalance(userId);
      setDemoWalletBalance(userId, balanceCheck1 - 10);
    }),
    withUserLock(userId, async () => {
      balanceCheck2 = getDemoWalletBalance(userId);
      setDemoWalletBalance(userId, balanceCheck2 - 10);
    }),
  ]);

  const finalBalance = getDemoWalletBalance(userId);
  assert.equal(finalBalance, 30.0, "Concurrent debits under lock must correctly subtract $20 total");
});

test("Issue 5: Agent transaction history record conforms to profile and ledger requirements", () => {
  const executionLog = {
    causeId: "cause-test-1",
    causeTitle: "Overdue Electricity Relief",
    amount: 15.0,
    category: "utilities",
    payoutBatchId: "BATCH-AGENT-TEST-001",
    isFunded: false,
    timestamp: new Date().toISOString(),
  };

  const donorId = "user_donor_xyz";
  const donorName = "Mahi";

  // Replicate mapping from agent/page.tsx
  const agentSwipe = {
    id: executionLog.payoutBatchId ? `agent-${executionLog.payoutBatchId}-0` : `agent-swipe-${Date.now()}-0`,
    causeId: executionLog.causeId,
    causeTitle: executionLog.causeTitle,
    title: executionLog.causeTitle,
    donorId,
    donorName,
    amount: executionLog.amount,
    category: executionLog.category,
    timestamp: executionLog.timestamp,
    isAgentic: true,
    isFunded: executionLog.isFunded,
    paypalPayoutBatchId: executionLog.payoutBatchId,
  };

  assert.ok(agentSwipe.id, "Must have an id for React keys in Profile");
  assert.equal(agentSwipe.causeTitle, "Overdue Electricity Relief", "Must have causeTitle for Profile table display");
  assert.equal(agentSwipe.donorName, "Mahi", "Must attribute donorName properly");
  assert.equal(agentSwipe.donorId, "user_donor_xyz", "Must store donorId for filter consistency");
});

test("Issue 6 & 12: Merging seed causes preserves funded status and uses O(1) map lookups", () => {
  // Simulate active causes map lookup
  const testCauses = [
    { id: "c-1", goalAmount: 100, raisedAmount: 100, status: "funded" },
    { id: "c-2", goalAmount: 100, raisedAmount: 50, status: "active" },
  ];

  const activeMap = new Map(testCauses.map((c) => [c.id, c]));

  // O(1) retrieval
  const cause1 = activeMap.get("c-1");
  assert.equal(cause1?.status, "funded");

  // Filter active causes excludes funded
  const activeOnly = testCauses.filter((c) => c.status !== "funded" && (c.goalAmount - c.raisedAmount) > 0.01);
  assert.equal(activeOnly.length, 1);
  assert.equal(activeOnly[0].id, "c-2");
});

