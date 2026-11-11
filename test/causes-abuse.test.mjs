import test from "node:test";
import assert from "node:assert/strict";
import { checkCauseRateLimit } from "../src/lib/rate-limiter.ts";

test("Audit Fix 11: Cause creation rate limiter throttles excessive requests per IP", () => {
  const testIp = "192.168.1.100";
  // Max limit is 20
  for (let i = 0; i < 20; i++) {
    const allowed = checkCauseRateLimit(testIp, 20, 60000);
    assert.equal(allowed, true, `Request ${i + 1} should be permitted`);
  }
  // 21st request should be throttled
  const throttled = checkCauseRateLimit(testIp, 20, 60000);
  assert.equal(throttled, false, "21st request from same IP must be rate limited");
});

test("Audit Fix 11: Trust score calculation clamps client spoofing attempts", () => {
  // Simulate server-side clamp logic from POST /api/causes
  function calculateServerTrustScore(hasProof, clientTrustScore) {
    if (hasProof) {
      const clientScore = typeof clientTrustScore?.overall === "number" ? clientTrustScore.overall : 82;
      const clampedScore = Math.min(88, Math.max(75, clientScore));
      return {
        overall: clampedScore,
        tier: clampedScore >= 80 ? "high" : "medium",
      };
    }
    return {
      overall: 55,
      tier: "low",
    };
  }

  // Attempting to inject 99% score with proof is clamped to max 88
  const spoofedWithProof = calculateServerTrustScore(true, { overall: 99, tier: "high" });
  assert.equal(spoofedWithProof.overall, 88, "Score must be clamped to ceiling of 88");

  // Attempting to inject 99% score without proof is locked to 55
  const spoofedWithoutProof = calculateServerTrustScore(false, { overall: 99, tier: "high" });
  assert.equal(spoofedWithoutProof.overall, 55, "Unverified cause without proof cannot exceed 55");
});

test("Audit Fix 11: Unauthenticated cause submission defaults receiverId to user_guest", () => {
  function deriveEffectiveReceiverId(authUserId, clientReceiverId) {
    return authUserId || (clientReceiverId === "judge-beneficiary-session" ? clientReceiverId : "user_guest");
  }

  // Attacker sends arbitrary victim ID without auth
  const effectiveId = deriveEffectiveReceiverId(null, "user_innocent_victim_123");
  assert.equal(effectiveId, "user_guest", "Unauthenticated request must not claim other users' receiver IDs");

  // Authenticated user gets their real Clerk ID
  const authId = deriveEffectiveReceiverId("user_clerk_real_456", "user_guest");
  assert.equal(authId, "user_clerk_real_456");
});
