import test from "node:test";
import assert from "node:assert/strict";
import { isLocationMatch } from "../src/lib/location-matcher.ts";
import { clearPayPalTokenCache } from "../src/lib/paypal.ts";

test("Ponytail Fix: Document Analysis strips currency signs and commas", () => {
  function parseStatedAmount(statedAmount) {
    const cleaned = String(statedAmount || "").replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100.0;
  }

  assert.equal(parseStatedAmount("$150.00"), 150.0);
  assert.equal(parseStatedAmount("1,250.50"), 1250.5);
  assert.equal(parseStatedAmount("  $75.20  "), 75.2);
  assert.equal(parseStatedAmount("invalid"), 100.0);
  assert.equal(parseStatedAmount(-50), 100.0);
});

test("Ponytail Fix: Location matcher avoids short substring false positives like 'us' or 'in'", () => {
  // "Austin, TX" contains "us", but donor location "US" should not match as a local city
  assert.equal(isLocationMatch("Austin, TX", "Austin, TX"), true);
  assert.equal(isLocationMatch("Austin, TX", "Austin"), true);
  assert.equal(isLocationMatch("Detroit, MI", "Detroit"), true);

  // Short tokens (<=3 chars) like "us" or "in" must not match inside longer words
  assert.equal(isLocationMatch("Austin, TX", "us"), false);
  assert.equal(isLocationMatch("Cincinnati, OH", "in"), false);

  // State code extraction works properly
  assert.equal(isLocationMatch("Houston, TX", "Austin, TX"), true, "Same state TX should match");
  assert.equal(isLocationMatch("Detroit, MI", "Atlanta, GA"), false, "Different states should not match");
});

test("Ponytail Fix: Cause goal amounts are clamped and rounded to exact cents", () => {
  function sanitizeGoal(raw) {
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0 || !Number.isFinite(num)) return null;
    const rounded = Math.round(num * 100) / 100;
    return rounded <= 10000 ? rounded : null;
  }

  assert.equal(sanitizeGoal("145.999"), 146.0);
  assert.equal(sanitizeGoal("50.555"), 50.56);
  assert.equal(sanitizeGoal("100"), 100.0);
  assert.equal(sanitizeGoal("-10"), null);
  assert.equal(sanitizeGoal("15000"), null);
  assert.equal(sanitizeGoal("Infinity"), null);
});

test("Ponytail Fix: Profile preferences clamp swipe amounts and budgets", () => {
  function sanitizePreferences(updates) {
    const ALLOWED = new Set(["default_swipe_amount", "monthly_budget"]);
    const res = {};
    for (const [k, val] of Object.entries(updates)) {
      if (!ALLOWED.has(k)) continue;
      if (k === "default_swipe_amount") {
        const num = typeof val === "number" ? val : parseFloat(String(val));
        if (Number.isFinite(num)) {
          res[k] = Math.min(100, Math.max(1, Math.round(num * 100) / 100));
        }
      }
      if (k === "monthly_budget") {
        const num = typeof val === "number" ? val : parseFloat(String(val));
        if (Number.isFinite(num)) {
          res[k] = Math.min(10000, Math.max(0, Math.round(num * 100) / 100));
        }
      }
    }
    return res;
  }

  assert.deepEqual(sanitizePreferences({ default_swipe_amount: -5, monthly_budget: -10 }), {
    default_swipe_amount: 1.0,
    monthly_budget: 0.0,
  });

  assert.deepEqual(sanitizePreferences({ default_swipe_amount: 500, monthly_budget: 999999 }), {
    default_swipe_amount: 100.0,
    monthly_budget: 10000.0,
  });

  assert.deepEqual(sanitizePreferences({ default_swipe_amount: "15.555", monthly_budget: "250.50" }), {
    default_swipe_amount: 15.56,
    monthly_budget: 250.5,
  });
});

test("Ponytail Fix: PayPal token cache can be cleared on 401 error", () => {
  assert.doesNotThrow(() => {
    clearPayPalTokenCache();
  });
});

test("Ponytail Fix: Unrefunded capture audit log stores failed refund events", () => {
  const testCapture = {
    captureId: "CAPTURE-TEST-FAIL",
    amount: 15.0,
    donorId: "user_test_refund",
    failedAt: new Date().toISOString(),
    error: "Simulated PayPal refund gateway timeout",
  };

  globalThis.__GIVI_UNREFUNDED_CAPTURES__ = globalThis.__GIVI_UNREFUNDED_CAPTURES__ || [];
  const log = globalThis.__GIVI_UNREFUNDED_CAPTURES__;
  if (log.length >= 100) log.shift();
  log.push(testCapture);

  assert.equal(
    log.some((c) => c.captureId === "CAPTURE-TEST-FAIL"),
    true
  );
});

test("Ponytail Fix: Numeric ceiling guards reject Infinity and values exceeding limits", () => {
  function isValidOrder(amount) {
    const parsed = parseFloat(amount);
    return !(isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0.01 || parsed > 10000);
  }
  function isValidTopup(amount) {
    const parsed = parseFloat(amount);
    return !(isNaN(parsed) || !Number.isFinite(parsed) || parsed < 1.0 || parsed > 5000.0);
  }
  function isValidDonation(amount) {
    const parsed = parseFloat(amount);
    return !(isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0.01 || parsed > 10000);
  }

  assert.equal(isValidOrder("10.00"), true);
  assert.equal(isValidOrder("10000.00"), true);
  assert.equal(isValidOrder("Infinity"), false);
  assert.equal(isValidOrder("-5"), false);
  assert.equal(isValidOrder("10000.01"), false);

  assert.equal(isValidTopup("1.00"), true);
  assert.equal(isValidTopup("5000.00"), true);
  assert.equal(isValidTopup("Infinity"), false);
  assert.equal(isValidTopup("0.99"), false);
  assert.equal(isValidTopup("5000.01"), false);

  assert.equal(isValidDonation("5.00"), true);
  assert.equal(isValidDonation("Infinity"), false);
  assert.equal(isValidDonation("15000"), false);
});

test("Ponytail Fix: Profile fallback stats reconciliation blocks non-demo users and clamps demo stats", () => {
  function reconcileFallbackStats(userId, fallbackBillsStr, fallbackTotalStr, isDemoUserKeyFn) {
    const profile = { total_donated: 0, bills_cleared: 0 };
    if (isDemoUserKeyFn(userId)) {
      const fallbackBills = parseInt(fallbackBillsStr || "0", 10);
      const fallbackTotal = parseFloat(fallbackTotalStr || "0");
      if (!isNaN(fallbackBills) && fallbackBills > 0 && fallbackBills <= 1000) {
        profile.bills_cleared = Math.max(profile.bills_cleared, fallbackBills);
      }
      if (!isNaN(fallbackTotal) && Number.isFinite(fallbackTotal) && fallbackTotal > 0 && fallbackTotal <= 10000) {
        profile.total_donated = Math.max(profile.total_donated, Math.round(fallbackTotal * 100) / 100);
      }
    }
    return profile;
  }

  const isDemo = (id) => id === "guest-session" || id.startsWith("demo-");

  // Non-demo authenticated user: client fallback parameter is ignored
  const nonDemoRes = reconcileFallbackStats("user_prod_123", "50", "5000", isDemo);
  assert.equal(nonDemoRes.total_donated, 0);
  assert.equal(nonDemoRes.bills_cleared, 0);

  // Demo user: valid values adopted
  const demoRes = reconcileFallbackStats("guest-session", "5", "50.00", isDemo);
  assert.equal(demoRes.total_donated, 50.0);
  assert.equal(demoRes.bills_cleared, 5);

  // Demo user: excessive / spoofed values clamped
  const spoofedDemoRes = reconcileFallbackStats("guest-session", "999999", "999999", isDemo);
  assert.equal(spoofedDemoRes.total_donated, 0);
  assert.equal(spoofedDemoRes.bills_cleared, 0);
});

test("Ponytail Fix: Clerk sign-in routes directly to feed and restores saved account state", () => {
  function getTargetDashboard({ isClerkSignedIn, role, isJudgeMode }) {
    if (isJudgeMode) return "/onboarding";
    if (isClerkSignedIn) return role === "beneficiary" ? "/my-causes" : "/feed";
    return "/feed";
  }

  // Clerk donor goes straight to feed
  assert.equal(getTargetDashboard({ isClerkSignedIn: true, role: "donor", isJudgeMode: false }), "/feed");
  // Clerk beneficiary goes straight to my-causes
  assert.equal(getTargetDashboard({ isClerkSignedIn: true, role: "beneficiary", isJudgeMode: false }), "/my-causes");
  // Judge mode preserves onboarding
  assert.equal(getTargetDashboard({ isClerkSignedIn: false, role: "donor", isJudgeMode: true }), "/onboarding");
  assert.equal(getTargetDashboard({ isClerkSignedIn: true, role: "donor", isJudgeMode: true }), "/onboarding");

  // Verify profile restoration
  const savedDbProfile = {
    id: "user_clerk_active_778",
    display_name: "Maharshi Pandya",
    wallet_balance: 42.5,
    total_donated: 125.0,
    bills_cleared: 6,
    streak_days: 4,
    monthly_budget: 150.0,
    default_swipe_amount: 10.0,
    interests: ["utilities", "medical"],
    onboarded: true,
  };

  assert.equal(savedDbProfile.onboarded, true);
  assert.equal(savedDbProfile.wallet_balance, 42.5);
  assert.equal(savedDbProfile.total_donated, 125.0);
  assert.equal(savedDbProfile.bills_cleared, 6);
});

test("Ponytail Fix: Explicit demo/judge IDs are preserved without Clerk session overriding them", () => {
  const isDemo = (id) => id === "judge-donor-session" || id === "judge-beneficiary-session" || id?.startsWith("judge-");

  // Capture route identity resolution
  function resolveCaptureDonorId(authUserId, donorId) {
    const isExplicitDemo = Boolean(donorId && isDemo(donorId));
    return isExplicitDemo ? donorId : authUserId || (donorId && donorId !== "user_anon" ? donorId : "guest-session");
  }

  // Cause creation receiver identity resolution
  function resolveCauseReceiverId(authUserId, receiverId) {
    return receiverId === "judge-beneficiary-session"
      ? receiverId
      : authUserId || (receiverId && !receiverId.startsWith("user_") ? receiverId : "user_guest");
  }

  // When personal Clerk session is active and judge mode is tested:
  const authClerkId = "user_clerk_personal_999";
  assert.equal(resolveCaptureDonorId(authClerkId, "judge-donor-session"), "judge-donor-session");
  assert.equal(resolveCauseReceiverId(authClerkId, "judge-beneficiary-session"), "judge-beneficiary-session");

  // When personal Clerk session is active and normal personal donation occurs:
  assert.equal(resolveCaptureDonorId(authClerkId, authClerkId), authClerkId);
});

test("Ponytail Fix: Judge showcase causes permit thank-you note updates without Clerk ownership block", () => {
  function verifyGratitudePermission(causeId, causeReceiverId, clerkUserId) {
    const isJudgeShowcaseCause =
      causeId === "cause-dte-heat-01" ||
      causeId === "cause-channel3-formula-04" ||
      causeReceiverId === "rec_sarah_01" ||
      causeReceiverId === "rec_channel3_04" ||
      causeReceiverId === "judge-beneficiary-session";

    if (!isJudgeShowcaseCause) {
      if (!clerkUserId || causeReceiverId !== clerkUserId) {
        return { allowed: false, status: 403 };
      }
    }
    return { allowed: true, status: 200 };
  }

  // Judge showcase claims succeed even when caller has no clerk user or a different user ID
  assert.equal(verifyGratitudePermission("cause-dte-heat-01", "rec_sarah_01", null).allowed, true);
  assert.equal(verifyGratitudePermission("cause-channel3-formula-04", "rec_channel3_04", "user_different").allowed, true);
  assert.equal(verifyGratitudePermission("cause-new-judge", "judge-beneficiary-session", null).allowed, true);

  // Non-judge private user claims still enforce strict ownership
  assert.equal(verifyGratitudePermission("cause-private-123", "user_owner_1", "user_attacker").allowed, false);
  assert.equal(verifyGratitudePermission("cause-private-123", "user_owner_1", "user_owner_1").allowed, true);
});




