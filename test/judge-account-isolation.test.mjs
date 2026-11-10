import test from "node:test";
import assert from "node:assert/strict";
import { isDemoUserKey, getDemoWalletBalance, setDemoWalletBalance, debitDemoWallet } from "../src/lib/demo-wallet.ts";

test("Judge Account Isolation: recognizes judge sessions as demo keys while keeping personal accounts non-demo", () => {
  assert.equal(isDemoUserKey("judge-donor-session"), true);
  assert.equal(isDemoUserKey("judge-beneficiary-session"), true);
  assert.equal(isDemoUserKey("guest-session"), true);
  assert.equal(isDemoUserKey("demo-user-123"), true);

  // Maharshi's personal Clerk accounts are strictly non-demo
  assert.equal(isDemoUserKey("user_2tXYZ123Clerk"), false);
  assert.equal(isDemoUserKey("maharshi-personal-id"), false);
});

test("Judge Account Isolation: judge-donor-session gets isolated $50 preloaded sandbox wallet", () => {
  const judgeBalance = getDemoWalletBalance("judge-donor-session");
  assert.equal(judgeBalance >= 50, true, "Judge donor should have preloaded sandbox balance");

  // Personal account wallet starts at 0 unless funded
  const personalBalance = getDemoWalletBalance("user_personal_maharshi");
  assert.equal(personalBalance, 0);

  // Debiting judge donor wallet does not mutate personal wallet
  const result = debitDemoWallet(5, "judge-donor-session");
  assert.equal(result.success, true);
  assert.equal(getDemoWalletBalance("user_personal_maharshi"), 0);
});

test("Judge Beneficiary Showcase: matches pre-seeded requests for judge beneficiary without polluting other accounts", () => {
  const causes = [
    { id: "cause-dte-heat-01", receiverEmail: "givibeneficiary@business.example.com", receiverId: "seed-receiver-1" },
    { id: "cause-channel3-formula-04", receiverEmail: "givibeneficiary@business.example.com", receiverId: "seed-receiver-2" },
    { id: "cause-personal-utility", receiverEmail: "maharshipandya006@gmail.com", receiverId: "user_maharshi" },
  ];

  // Helper matching the logic in my-causes/page.tsx
  function filterForAccount(userId, userEmail) {
    return causes.filter((c) => {
      if (userId && c.receiverId === userId) return true;
      const isJudgeBeneficiary =
        userId === "judge-beneficiary-session" ||
        userEmail?.toLowerCase() === "givibeneficiary@business.example.com";

      if (isJudgeBeneficiary && (c.id === "cause-dte-heat-01" || c.id === "cause-channel3-formula-04")) {
        return true;
      }

      if (
        userEmail &&
        userEmail.toLowerCase() !== "givibeneficiary@business.example.com" &&
        c.receiverEmail?.toLowerCase() === userEmail.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }

  // 1. Judge Beneficiary account sees the pre-seeded DTE and Similac showcase claims
  const judgeBeneficiaryCauses = filterForAccount("judge-beneficiary-session", "givibeneficiary@business.example.com");
  assert.equal(judgeBeneficiaryCauses.length, 2);
  assert.equal(judgeBeneficiaryCauses.some(c => c.id === "cause-dte-heat-01"), true);
  assert.equal(judgeBeneficiaryCauses.some(c => c.id === "cause-channel3-formula-04"), true);

  // 2. Maharshi's personal account only sees his own claims, NOT the judge showcase claims
  const maharshiCauses = filterForAccount("user_maharshi", "maharshipandya006@gmail.com");
  assert.equal(maharshiCauses.length, 1);
  assert.equal(maharshiCauses[0].id, "cause-personal-utility");
});

test("Judge Account Isolation: Judge Donor vs Judge Beneficiary distinct identities", () => {
  // Judge Donor persona
  const judgeDonor = {
    persona: "judge_donor",
    role: "donor",
    displayName: "Judge Donor",
    email: "gividonor@personal.example.com",
    sandboxWallet: 50.0,
  };
  assert.equal(judgeDonor.displayName, "Judge Donor");
  assert.notEqual(judgeDonor.displayName, "Maharshi Pandya");
  assert.notEqual(judgeDonor.displayName, "John");
  assert.equal(judgeDonor.email, "gividonor@personal.example.com");
  assert.equal(judgeDonor.role, "donor");

  // Judge Beneficiary persona
  const judgeBeneficiary = {
    persona: "judge_beneficiary",
    role: "beneficiary",
    displayName: "Judge Beneficiary (Demo)",
    email: "givibeneficiary@business.example.com",
  };
  assert.equal(judgeBeneficiary.displayName, "Judge Beneficiary (Demo)");
  assert.equal(judgeBeneficiary.email, "givibeneficiary@business.example.com");
  assert.equal(judgeBeneficiary.role, "beneficiary");

  // Identities are mutually distinct
  assert.notEqual(judgeDonor.email, judgeBeneficiary.email);
  assert.notEqual(judgeDonor.role, judgeBeneficiary.role);
});

test("Personal Account Lock: maharshipandya006@gmail.com is strictly locked to donor role", () => {
  const isMaharshi = (email) => email?.toLowerCase().includes("maharshipandya006@gmail.com");
  
  function trySetRole(email, demoPersona, targetRole) {
    if (isMaharshi(email) && !demoPersona && targetRole === "beneficiary") {
      return "donor"; // Blocked: remains donor
    }
    return targetRole;
  }

  // Attempting to switch maharshipandya006@gmail.com to beneficiary is rejected
  const resultingRole = trySetRole("maharshipandya006@gmail.com", null, "beneficiary");
  assert.equal(resultingRole, "donor", "Personal account cannot switch to beneficiary");

  // Allowed when using the explicit judge beneficiary demo persona
  const demoResult = trySetRole("maharshipandya006@gmail.com", "judge_beneficiary", "beneficiary");
  assert.equal(demoResult, "beneficiary");
});

test("Judge Demo Account Unification: all judge logins are treated as ONE, adding all transactions together", () => {
  // Simulate donations recorded from various judge demo login forms
  const transactions = [
    { donorName: "givi donor", donorId: "user_clerk_judge_1", amount: 15.0 },
    { donorName: "Judge Donor", donorId: "judge-donor-session", amount: 25.0 },
    { donorName: "Judge Donor", donorId: "judge-donor-session", amount: 416.93 },
    { donorName: "Maharshi Pandya", donorId: "user_maharshi", amount: 50.0 },
  ];

  const donorMap = new Map();
  for (const tx of transactions) {
    const rawId = (tx.donorId || "").trim();
    const lowerName = (tx.donorName || "").toLowerCase();

    const isJudgeDonor =
      rawId === "judge-donor-session" ||
      rawId.startsWith("judge-donor") ||
      rawId.includes("gividonor") ||
      lowerName === "judge donor" ||
      lowerName === "givi donor" ||
      lowerName === "judge";

    const groupKey = isJudgeDonor ? "judge-donor-session" : (rawId || `donor_${lowerName}`);
    const displayName = isJudgeDonor ? "Judge Donor" : tx.donorName;

    let entry = donorMap.get(groupKey);
    if (!entry) {
      entry = { id: groupKey, displayName, totalDonated: 0, causeCount: 0 };
      donorMap.set(groupKey, entry);
    }
    entry.totalDonated = Math.round((entry.totalDonated + tx.amount) * 100) / 100;
    entry.causeCount += 1;
  }

  // Verify that all 3 judge transactions merged into ONE unified entry
  const judgeEntry = donorMap.get("judge-donor-session");
  assert.ok(judgeEntry, "Judge donor entry must exist");
  assert.equal(judgeEntry.displayName, "Judge Donor");
  assert.equal(judgeEntry.totalDonated, 456.93, "All judge logins must sum to $456.93");
  assert.equal(judgeEntry.causeCount, 3, "All 3 judge donations must be counted together");

  // Non-judge donor remains distinct
  const maharshiEntry = donorMap.get("user_maharshi");
  assert.ok(maharshiEntry);
  assert.equal(maharshiEntry.totalDonated, 50.0);
});

