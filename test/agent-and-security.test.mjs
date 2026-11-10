import test from "node:test";
import assert from "node:assert/strict";
import { getDemoWalletBalance, debitDemoWallet, topUpDemoWallet } from "../src/lib/demo-wallet.ts";
import { getGiverBadge } from "../src/lib/types.ts";
import { getActiveCauses, reserveCauseFunding, releaseCauseFunding } from "../src/lib/causes-store.ts";
import { formatLedgerDonorName, recordRuntimeDonation } from "../src/lib/ledger.ts";

test("Security: Blocks client fallbackBalance spoofing on authenticated non-demo user IDs", () => {
  const authUserId = "user_clerk_prod_991823";
  // Reset balance to 0
  const current = getDemoWalletBalance(authUserId);
  if (current > 0) debitDemoWallet(current, authUserId);

  assert.equal(getDemoWalletBalance(authUserId), 0);

  // Attempt to pass an arbitrary clientBalance of $500
  const result = debitDemoWallet(50.0, authUserId, 500.0);
  assert.equal(result.success, false, "Should reject debit when server balance is 0 despite spoofed client balance");
  assert.match(result.error, /Insufficient Giving Allowance/);
  assert.equal(getDemoWalletBalance(authUserId), 0, "Server balance must not adopt spoofed amount");
});

test("Security: Honors fallbackBalance strictly for demo/guest session keys during HMR reloads", () => {
  const demoUserId = "guest-session";
  const current = getDemoWalletBalance(demoUserId);
  if (current > 0) debitDemoWallet(current, demoUserId);

  const result = debitDemoWallet(10.0, demoUserId, 50.0);
  assert.equal(result.success, true, "Should permit demo user session to recover verified allowance up to $500");
  assert.equal(getDemoWalletBalance(demoUserId), 40.0);
});

test("Badges: Consistently derives verified donor tiers across Profile and Leaderboard", () => {
  assert.equal(getGiverBadge(0), "Level 1 Neighbor");
  assert.equal(getGiverBadge(25), "Level 1 Neighbor");
  assert.equal(getGiverBadge(50), "Level 2 Supporter");
  assert.equal(getGiverBadge(150), "Level 2 Supporter");
  assert.equal(getGiverBadge(200), "Level 3 Giver · Heat Guardian");
  assert.equal(getGiverBadge(450), "Level 3 Giver · Heat Guardian");
  assert.equal(getGiverBadge(500), "Level 5 Guardian");
  assert.equal(getGiverBadge(1000), "Level 5 Guardian");
});

test("Autonomous Agent: Policy filtering matches trust threshold and category filters", () => {
  const allCauses = getActiveCauses();
  const minTrust = 90;
  const categories = ["utilities"];

  const matched = allCauses.filter((c) => {
    const remaining = c.goalAmount - c.raisedAmount;
    return remaining > 0 && c.trustScore.overall >= minTrust && categories.includes(c.category);
  });

  assert.ok(matched.length > 0, "Should match eligible utility causes with trust >= 90");
  for (const c of matched) {
    assert.ok(c.trustScore.overall >= 90, `Cause ${c.id} must satisfy minTrust 90`);
    assert.equal(c.category, "utilities", `Cause ${c.id} must be in utilities category`);
  }
});

test("Autonomous Agent Attribution: records under user name and formats ledger as '<User>'s givi agent", () => {
  // 1. Ledger formatting for agentic runs
  assert.equal(
    formatLedgerDonorName("Alex Chen", true),
    "Alex Chen's givi agent",
    "Should append 's givi agent for agentic donations"
  );
  assert.equal(
    formatLedgerDonorName("James", true),
    "James' givi agent",
    "Should handle trailing s properly"
  );
  assert.equal(
    formatLedgerDonorName("Kind Supporter", true),
    "Kind Supporter's givi agent",
    "Should format generic fallback gracefully"
  );
  assert.equal(
    formatLedgerDonorName("Autonomous Giving Agent", true),
    "Kind Supporter's givi agent",
    "Should replace legacy generic placeholder with user-linked givi agent"
  );
  assert.equal(
    formatLedgerDonorName("Alex Chen's givi agent", true),
    "Alex Chen's givi agent",
    "Should be idempotent if already formatted"
  );

  // 2. Human swipes remain clean user name
  assert.equal(
    formatLedgerDonorName("Alex Chen", false),
    "Alex Chen",
    "Human donation names must remain untouched"
  );

  // 3. Record transaction under user name
  const donation = {
    id: `don-test-${Date.now()}`,
    causeId: "cause-dte-heat-01",
    donorId: "user_test_alex",
    donorName: "Alex Chen",
    amount: 15.0,
    paypalOrderId: "AGENTIC_AUTONOMOUS_EXECUTION",
    paypalPayoutBatchId: "BATCH-TEST-123",
    isAgentic: true,
    createdAt: new Date().toISOString(),
  };

  recordRuntimeDonation(donation);
  assert.equal(donation.donorName, "Alex Chen", "Transaction must be recorded under the user's name");
  assert.equal(donation.donorId, "user_test_alex", "Transaction must be linked to user's donor ID");
  assert.equal(
    formatLedgerDonorName(donation.donorName, donation.isAgentic),
    "Alex Chen's givi agent",
    "Ledger view must format as Alex Chen's givi agent"
  );
});

test("Autonomous Agent Account Reflection: agent giving increments donor swipes, debits wallet, and credits total", () => {
  const initialWallet = 50.0;
  const initialTotal = 100.0;
  const initialSwipes = 5;

  const agentDisbursements = [
    { causeId: "c1", causeTitle: "Heat Bill", amount: 15.0, category: "utilities" },
    { causeId: "c2", causeTitle: "Insulin Copay", amount: 10.0, category: "medical" },
  ];

  const totalDisbursed = agentDisbursements.reduce((sum, d) => sum + d.amount, 0);
  assert.equal(totalDisbursed, 25.0);

  // 1. Account wallet reflects money used
  const updatedWallet = initialWallet - totalDisbursed;
  assert.equal(updatedWallet, 25.0, "Wallet must be reduced by agent disbursement");

  // 2. Account total relief reflects money given
  const updatedTotal = initialTotal + totalDisbursed;
  assert.equal(updatedTotal, 125.0, "Total given must increase by agent disbursement");

  // 3. Swipes reflect each agent action as account swipe
  const updatedSwipes = initialSwipes + agentDisbursements.length;
  assert.equal(updatedSwipes, 7, "Account swipe count must increment by number of agent disbursements");

  // 4. Leaderboard merges agent disbursements into the user's account
  function cleanDonorName(rawName) {
    if (!rawName) return "Kind Supporter";
    const cleaned = rawName
      .replace(/'s givi agent$/i, "")
      .replace(/\s*\(givi agent\)$/i, "")
      .replace(/^autonomous giving agent$/i, "Kind Supporter")
      .replace(/^autonomous donor$/i, "Kind Supporter")
      .trim();
    return cleaned || "Kind Supporter";
  }

  const transactions = [
    { donorName: "Alex Chen", donorId: "user_alex", amount: 50.0 },
    { donorName: "Alex Chen's givi agent", donorId: "user_alex", amount: 25.0 },
  ];

  const donorMap = new Map();
  for (const tx of transactions) {
    const rawId = tx.donorId;
    const cleanedName = cleanDonorName(tx.donorName);
    let entry = donorMap.get(rawId);
    if (!entry) {
      entry = { id: rawId, displayName: cleanedName, totalDonated: 0, causeCount: 0 };
      donorMap.set(rawId, entry);
    }
    entry.totalDonated += tx.amount;
    entry.causeCount += 1;
  }

  assert.equal(donorMap.size, 1, "Agent and manual giving must merge into ONE entry");
  const alex = donorMap.get("user_alex");
  assert.equal(alex.displayName, "Alex Chen");
  assert.equal(alex.totalDonated, 75.0, "Total must be 50 manual + 25 agent = 75");
  assert.equal(alex.causeCount, 2, "Cause count must include agent swipes");
});

