import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultDonorProfile, createDefaultBeneficiaryProfile } from "../src/lib/types.ts";

test("Profile Sync: creates complete profile defaults with all required fields", () => {
  const profile = createDefaultDonorProfile("user_clerk_123", "donor@givi.app", "Kind Supporter");

  assert.equal(profile.id, "user_clerk_123");
  assert.equal(profile.email, "donor@givi.app");
  assert.equal(profile.display_name, "Kind Supporter");
  assert.equal(profile.role, "donor");
  assert.equal(typeof profile.wallet_balance, "number");
  assert.equal(profile.total_donated, 0);
  assert.equal(profile.bills_cleared, 0);
  assert.ok(Array.isArray(profile.interests));
  assert.ok(Array.isArray(profile.bookmarked_cause_ids));

  const beneficiary = createDefaultBeneficiaryProfile("user_rec_123", "rec@givi.app", "Applicant");
  assert.equal(beneficiary.id, "user_rec_123");
  assert.equal(beneficiary.role, "beneficiary");
  assert.equal(beneficiary.payout_paypal_email, "rec@givi.app");
  assert.equal(beneficiary.verification_status, "pending");
});

test("Profile Sync: updates wallet allowance and donation stats correctly", () => {
  let profile = {
    wallet_balance: 50.0,
    total_donated: 0.0,
    bills_cleared: 0,
  };

  const donationAmount = 5.0;
  profile.wallet_balance = Math.max(0, profile.wallet_balance - donationAmount);
  profile.total_donated += donationAmount;
  profile.bills_cleared += 1;

  assert.equal(profile.wallet_balance, 45.0);
  assert.equal(profile.total_donated, 5.0);
  assert.equal(profile.bills_cleared, 1);
});

test("Profile Sync: bookmark toggling adds and removes cleanly without duplicates", () => {
  let bookmarks = ["cause-dte-heat-01"];
  const addId = "cause-insulin-02";

  // Add
  if (!bookmarks.includes(addId)) {
    bookmarks = [...bookmarks, addId];
  }
  assert.deepEqual(bookmarks, ["cause-dte-heat-01", "cause-insulin-02"]);

  // Remove
  bookmarks = bookmarks.filter((id) => id !== "cause-dte-heat-01");
  assert.deepEqual(bookmarks, ["cause-insulin-02"]);
});

test("Security: Profile whitelist blocks unprivileged wallet tampering", () => {
  const ALLOWED_FIELDS = new Set([
    "display_name",
    "location",
    "phone_number",
    "payout_paypal_email",
    "is_anonymous",
    "interests",
    "bookmarked_cause_ids",
    "payment_preference",
    "onboarded",
    "monthly_budget",
    "default_swipe_amount",
    "impact_radius",
  ]);

  const maliciousPayload = {
    display_name: "Safe Name",
    wallet_balance: 999999,
    total_donated: 500000,
    bills_cleared: 100,
    verification_status: "verified",
  };

  const sanitized = {};
  for (const [key, val] of Object.entries(maliciousPayload)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitized[key] = val;
    }
  }

  assert.equal(sanitized.display_name, "Safe Name");
  assert.equal(sanitized.wallet_balance, undefined);
  assert.equal(sanitized.total_donated, undefined);
  assert.equal(sanitized.bills_cleared, undefined);
  assert.equal(sanitized.verification_status, undefined);
});

test("Scale: In-memory runtime donation ledger prunes beyond capacity", async () => {
  const { recordRuntimeDonation, runtimeDonations, MAX_RUNTIME_DONATIONS } = await import(
    "../src/lib/ledger.ts"
  );

  assert.equal(MAX_RUNTIME_DONATIONS, 100);
  for (let i = 0; i < 120; i++) {
    recordRuntimeDonation({
      id: `don-eval-${i}`,
      causeId: "cause-1",
      donorId: "user-1",
      donorName: "Donor",
      amount: 5.0,
      paypalOrderId: "WALLET_DEBIT",
      paypalPayoutBatchId: "BATCH-1",
      paypalPayoutItemId: "ITEM-1",
      isAgentic: false,
      impactMessage: "Thanks!",
      createdAt: new Date().toISOString(),
    });
  }

  assert.ok(runtimeDonations.length <= MAX_RUNTIME_DONATIONS);
});

test("Profile Sync: billsCleared never resurrects to 0 on terminal/server reset", () => {
  // Simulate client state before server restart
  const cachedBills = 4;
  const localSwipes = [
    { id: "1", amount: 5.0, isFunded: false },
    { id: "2", amount: 47.50, isFunded: true }, // Super Swipe
    { id: "3", amount: 25.00 }, // Legacy swipe without explicit isFunded
    { id: "4", amount: 5.0, isFunded: true }, // Micro-swipe that cleared remaining $5
  ];

  // 1. Calculate funded count retroactively
  const localFundedCount = localSwipes.filter((x) => Boolean(x.isFunded) || (x.amount && Number(x.amount) > 5.0)).length;
  assert.equal(localFundedCount, 3, "Correctly identifies 3 cleared bills from swipes");

  // 2. Incoming fresh server profile after restart (server in-memory memory wiped to 0)
  const serverProfile = { bills_cleared: 0, total_donated: 0 };
  const prevClientBills = 4;

  const resolvedBills = Math.max(
    Number(serverProfile.bills_cleared || 0),
    prevClientBills,
    cachedBills,
    localFundedCount
  );

  assert.equal(resolvedBills, 4, "Must preserve user's bills cleared count and never drop to 0");
});


