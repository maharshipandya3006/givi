import test from "node:test";
import assert from "node:assert/strict";
import { SEED_CAUSES } from "../src/lib/seed-data.ts";
import { activeCauses, replenishCausesIfAllFunded, findCauseById } from "../src/lib/causes-store.ts";

test("Explore: Excludes 100% fulfilled causes", () => {
  const causes = [
    { id: "c1", goalAmount: 50, raisedAmount: 50, status: "funded" },
    { id: "c2", goalAmount: 100, raisedAmount: 99.999, status: "funded" },
    { id: "c3", goalAmount: 75, raisedAmount: 25, status: "active" },
  ];

  const exploreList = causes.filter((c) => {
    const remaining = Math.round((c.goalAmount - c.raisedAmount) * 100) / 100;
    return c.status !== "funded" && remaining > 0.01;
  });

  assert.equal(exploreList.length, 1);
  assert.equal(exploreList[0].id, "c3");
});

test("Explore & Feed: Replenishes when all causes reach 100% fulfillment", () => {
  // Simulate all causes being marked funded
  for (const c of activeCauses) {
    c.status = "funded";
    c.raisedAmount = c.goalAmount;
  }

  // Trigger replenish
  replenishCausesIfAllFunded();

  const activeUnfunded = activeCauses.filter(
    (c) => c.status !== "funded" && Math.round((c.goalAmount - c.raisedAmount) * 100) / 100 > 0.01
  );

  assert.ok(activeUnfunded.length > 0, "Active causes should be replenished");
  assert.equal(activeUnfunded[0].status, "active");
  assert.equal(activeUnfunded[0].raisedAmount, 0);
});

test("Explore & Feed: Replenish preserves category filter isolation", () => {
  for (const c of activeCauses) {
    c.status = "funded";
    c.raisedAmount = c.goalAmount;
  }

  replenishCausesIfAllFunded();

  const requestedCategory = "utilities";
  let fresh = activeCauses.filter((c) => c.status !== "funded" && (c.goalAmount - c.raisedAmount) > 0.01);
  if (requestedCategory && requestedCategory !== "all") {
    fresh = fresh.filter((c) => c.category === requestedCategory);
  }

  assert.ok(fresh.length > 0, "Should find replenished causes for category");
  assert.ok(
    fresh.every((c) => c.category === requestedCategory),
    "All returned causes must strictly match requested category"
  );
});

