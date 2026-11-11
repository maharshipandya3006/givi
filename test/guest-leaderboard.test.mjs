import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanDonorName,
  guestIdForUsername,
  isCustomGuestUsername,
  isGenericGuestName,
} from "../src/lib/guest-identity.ts";
import { aggregateLeaderboardTransactions } from "../src/lib/leaderboard-utils.ts";

test("Guest Identity: canonical guest IDs are deterministic and strictly case-sensitive", () => {
  const mahiUpper = guestIdForUsername("Mahi");
  const mahiLower = guestIdForUsername("mahi");
  const mahiRepeat = guestIdForUsername("  Mahi  ");

  assert.equal(mahiUpper, mahiRepeat);
  assert.notEqual(mahiUpper, mahiLower);
  assert.equal(mahiUpper.startsWith("guest-u-"), true);

  assert.equal(isGenericGuestName("Kind Supporter"), true);
  assert.equal(isGenericGuestName("Judge Donor"), true);
  assert.equal(isCustomGuestUsername("Mahi"), true);
  assert.equal(isCustomGuestUsername("Kind Supporter"), false);
  assert.equal(cleanDonorName("Mahi's givi agent"), "Mahi");
});

test("Leaderboard Aggregation: named guest Mahi ($7.50) and temp guest sessions stay isolated from unified bucket", () => {
  const entries = aggregateLeaderboardTransactions(
    [
      {
        id: "tx-1",
        timestamp: "2026-11-11T05:00:00Z",
        donorId: "guest-old-session-123",
        donorName: "Mahi",
        amount: 5.0,
        category: "utilities",
      },
      {
        id: "tx-2",
        timestamp: "2026-11-11T06:00:00Z",
        donorId: guestIdForUsername("Mahi"),
        donorName: "Mahi",
        amount: 2.5,
        category: "medical",
      },
      {
        id: "tx-3",
        timestamp: "2026-11-11T06:10:00Z",
        donorId: "guest-temp-other-999",
        donorName: "Kind Supporter",
        amount: 5.0,
        category: "food",
      },
      {
        id: "tx-4",
        timestamp: "2026-11-11T06:20:00Z",
        donorId: guestIdForUsername("mahi"),
        donorName: "mahi",
        amount: 4.0,
        category: "utilities",
      },
    ],
    []
  );

  const mahiEntry = entries.find((e) => e.displayName === "Mahi");
  const mahiLowerEntry = entries.find((e) => e.displayName === "mahi");
  const tempGuestEntry = entries.find((e) => e.id === "guest-temp-other-999");

  assert.ok(mahiEntry, "Mahi must have her own entry");
  assert.equal(mahiEntry.id, guestIdForUsername("Mahi"));
  assert.equal(mahiEntry.totalDonated, 7.5);
  assert.equal(mahiEntry.causeCount, 2);

  assert.ok(mahiLowerEntry, "Case-sensitive mahi must remain separate from Mahi");
  assert.equal(mahiLowerEntry.totalDonated, 4.0);

  assert.ok(tempGuestEntry, "Temp guest session must not be swallowed into unified Kind Supporter bucket");
  assert.equal(tempGuestEntry.totalDonated, 5.0);
});

test("Leaderboard Aggregation: Clerk user donating before renaming inherits profile display_name instead of guest pool", () => {
  const entries = aggregateLeaderboardTransactions(
    [
      {
        id: "tx-clerk-1",
        timestamp: "2026-11-11T05:00:00Z",
        donorId: "user_3abc123",
        donorName: "Kind Supporter",
        amount: 7.5,
        category: "utilities",
      },
    ],
    [
      {
        id: "user_3abc123",
        display_name: "Mahi",
        total_donated: 7.5,
        bills_cleared: 1,
        is_anonymous: false,
      },
    ]
  );

  const clerkMahi = entries.find((e) => e.id === "user_3abc123");
  assert.ok(clerkMahi);
  assert.equal(clerkMahi.displayName, "Mahi");
  assert.equal(clerkMahi.totalDonated, 7.5);
});

test("Leaderboard Aggregation: backfills from donor_profiles in All-Time view but preserves Weekly transaction totals", () => {
  const profiles = [
    {
      id: "guest-old-session-abc",
      display_name: "Mahi",
      total_donated: 7.5,
      bills_cleared: 1,
      is_anonymous: false,
    },
  ];

  const allTimeEntries = aggregateLeaderboardTransactions([], profiles, { isWeekly: false });
  const mahiAll = allTimeEntries.find((e) => e.displayName === "Mahi");
  assert.ok(mahiAll, "Stored profile Mahi ($7.50) must appear in All-Time even if donations rows were absent");
  assert.equal(mahiAll.totalDonated, 7.5);

  const weeklyEntries = aggregateLeaderboardTransactions([], profiles, { isWeekly: true });
  assert.equal(
    weeklyEntries.some((e) => e.displayName === "Mahi"),
    false,
    "Weekly view should not fabricate weekly donations from all-time profile counters"
  );
});

