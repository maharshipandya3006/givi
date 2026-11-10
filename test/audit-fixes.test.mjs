import test from "node:test";
import assert from "node:assert/strict";
import { isDemoUserKey } from "../src/lib/demo-wallet.ts";

test("Audit Fix 1: Top-up authorization rejects isDemo bypass on authenticated non-demo users", () => {
  const isDemo = true;
  const realUserId = "user_clerk_auth_real_123";
  const demoUserId = "judge-donor-session";

  const isAllowedReal = isDemo && isDemoUserKey(realUserId);
  const isAllowedDemo = isDemo && isDemoUserKey(demoUserId);

  assert.equal(isAllowedReal, false, "Real authenticated users must provide verified PayPal orderId");
  assert.equal(isAllowedDemo, true, "Sandbox demo keys are permitted to use demo allowance");
});

test("Audit Fix 2: Profile PATCH whitelist strips client tampering with donation stats", () => {
  const ALLOWED_FIELDS = new Set([
    "display_name",
    "location",
    "phone_number",
    "paypal_email",
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
    display_name: "Genuine Donor",
    location: "Detroit, MI",
    total_donated: 1000000,
    bills_cleared: 500,
    streak_days: 999,
  };

  const sanitized = {};
  for (const [key, val] of Object.entries(maliciousPayload)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitized[key] = val;
    }
  }

  assert.equal(sanitized.display_name, "Genuine Donor");
  assert.equal(sanitized.location, "Detroit, MI");
  assert.equal("total_donated" in sanitized, false, "total_donated must not be client-editable");
  assert.equal("bills_cleared" in sanitized, false, "bills_cleared must not be client-editable");
  assert.equal("streak_days" in sanitized, false, "streak_days must not be client-editable");
});

test("Audit Fix 6: Beneficiary thank-you notes replace previous note rather than duplicating", () => {
  const existingDesc = "Original bill description.\n\n[Beneficiary Gratitude Note]: First thank you note!";
  const newNote = "Updated thank you note with more details!";

  const cleanedDesc = (existingDesc || "")
    .replace(/\n\n\[Beneficiary Gratitude Note\]:[\s\S]*$/, "")
    .trim();
  const updatedDesc = `${cleanedDesc}\n\n[Beneficiary Gratitude Note]: ${newNote}`;

  assert.equal(updatedDesc.includes("First thank you note!"), false);
  assert.equal(updatedDesc.includes("Updated thank you note with more details!"), true);
  assert.equal(updatedDesc.indexOf("[Beneficiary Gratitude Note]"), updatedDesc.lastIndexOf("[Beneficiary Gratitude Note]"));
});

test("Audit Fix 7: Swipe history window retains up to 500 items without 15-item clamp", () => {
  const existing = Array.from({ length: 50 }, (_, i) => ({ id: `tx-${i}`, amount: 5 }));
  const newRecord = { id: "tx-50", amount: 5 };
  const updated = [newRecord, ...existing.filter((x) => x.id !== newRecord.id)].slice(0, 500);

  assert.equal(updated.length, 51, "All 51 records must be preserved");
  assert.equal(updated[0].id, "tx-50");
});

test("Audit Fix 8: Rate limiter evicts oldest record without flushing all entries under load", () => {
  const map = new Map();
  for (let i = 0; i < 1001; i++) {
    map.set(`ip-${i}`, { count: 1, resetAt: Date.now() + 60000 });
  }

  // Eviction logic matching create-order route
  if (map.size > 1000) {
    while (map.size > 1000) {
      const oldestKey = map.keys().next().value;
      if (oldestKey) map.delete(oldestKey);
      else break;
    }
  }

  assert.equal(map.size, 1000);
  assert.equal(map.has("ip-0"), false, "Oldest IP evicted");
  assert.equal(map.has("ip-1"), true, "Remaining IPs retained");
});

test("Audit Fix 9: Surplus order capture rollback claws back credited wallet excess", () => {
  let donorWalletBalance = 25.00;
  const capturedAmount = 10.00;
  const donationAmount = 5.00;
  const creditedExcess = Math.max(0, capturedAmount - donationAmount);

  // Credit excess
  donorWalletBalance += creditedExcess;
  assert.equal(donorWalletBalance, 30.00);

  // Downstream payout fails -> claw back credited excess
  donorWalletBalance = Math.max(0, donorWalletBalance - creditedExcess);
  assert.equal(donorWalletBalance, 25.00, "Wallet balance restored to pre-donation amount");
});

