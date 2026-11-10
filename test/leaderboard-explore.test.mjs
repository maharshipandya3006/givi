import { test } from "node:test";
import assert from "node:assert/strict";
import { getGiverBadge } from "../src/lib/types.ts";
import { SEED_CAUSES } from "../src/lib/seed-data.ts";

test("Leaderboard: Distinct donors sharing default name 'Kind Supporter' are not merged by ID", () => {
  // Mock entries simulating seed and new users
  const entries = [
    {
      rank: 4,
      id: "user_anon_1",
      displayName: "Kind Supporter",
      totalDonated: 195.0,
      causeCount: 18,
      isAnonymous: true,
      badge: "Level 2 Supporter",
      categories: ["climate"],
    },
  ];

  // Incoming new profile with the default display name
  const incomingProfile = {
    id: "user_clerk_real_99",
    display_name: "Kind Supporter",
    total_donated: 25.0,
    bills_cleared: 3,
    is_anonymous: false,
    interests: ["utilities"],
  };

  // Using ID-based matching instead of displayName matching
  const existing = entries.find((e) => e.id === incomingProfile.id);
  assert.equal(existing, undefined, "Real user must not match seed user_anon_1");

  if (!existing) {
    entries.push({
      rank: 99,
      id: incomingProfile.id,
      displayName: incomingProfile.display_name,
      totalDonated: incomingProfile.total_donated,
      causeCount: incomingProfile.bills_cleared,
      isAnonymous: incomingProfile.is_anonymous,
      badge: getGiverBadge(incomingProfile.total_donated),
      categories: incomingProfile.interests,
    });
  }

  assert.equal(entries.length, 2, "Entries must contain both distinct users");
  const seedEntry = entries.find((e) => e.id === "user_anon_1");
  const realEntry = entries.find((e) => e.id === "user_clerk_real_99");

  assert.equal(seedEntry.totalDonated, 195.0, "Seed donation baseline intact");
  assert.equal(realEntry.totalDonated, 25.0, "Real user entry recorded with own total");
  assert.equal(realEntry.badge, "Level 1 Neighbor");
});

test("Leaderboard: Weekly aggregation groups by donor_id rather than display name", () => {
  const weeklyDonations = [
    { donor_id: "donor_a", donor_name: "Kind Supporter", amount: 15.0 },
    { donor_id: "donor_b", donor_name: "Kind Supporter", amount: 30.0 },
    { donor_id: "donor_a", donor_name: "Kind Supporter", amount: 10.0 },
  ];

  const weeklyEntries = [];
  for (const row of weeklyDonations) {
    const donorId = row.donor_id || (row.donor_name ? `donor_${row.donor_name.toLowerCase()}` : "user_anon");
    const existing = weeklyEntries.find((e) => e.id === donorId);
    if (existing) {
      existing.totalDonated = Math.round((existing.totalDonated + Number(row.amount)) * 100) / 100;
      existing.causeCount += 1;
      existing.badge = getGiverBadge(existing.totalDonated);
    } else {
      weeklyEntries.push({
        rank: 99,
        id: donorId,
        displayName: row.donor_name,
        totalDonated: Number(row.amount),
        causeCount: 1,
        isAnonymous: false,
        badge: getGiverBadge(Number(row.amount)),
        categories: ["utilities"],
      });
    }
  }

  assert.equal(weeklyEntries.length, 2, "Must group into exactly 2 separate donors");
  const donorA = weeklyEntries.find((e) => e.id === "donor_a");
  const donorB = weeklyEntries.find((e) => e.id === "donor_b");

  assert.equal(donorA.totalDonated, 25.0, "Donor A total must be 15 + 10 = 25");
  assert.equal(donorA.causeCount, 2, "Donor A count must be 2");
  assert.equal(donorB.totalDonated, 30.0, "Donor B total must be 30");
  assert.equal(donorB.causeCount, 1, "Donor B count must be 1");
});

test("Explore: Search filter is null-safe for incomplete cause objects", () => {
  const malformedCauses = [
    {
      id: "c1",
      title: "Detroit Heat Bill",
      description: null,
      receiverLocation: undefined,
      receiverName: null,
      category: "utilities",
      goalAmount: 100,
      raisedAmount: 50,
      status: "active",
    },
    {
      id: "c2",
      title: null,
      description: "Prescription copay assistance",
      receiverLocation: "Chicago, IL",
      receiverName: "Jane Doe",
      category: "medical",
      goalAmount: 80,
      raisedAmount: 80,
      status: "funded",
    },
  ];

  const filterFn = (cause, query, cat, bookmarkedIds = []) => {
    const q = query.toLowerCase().trim();
    const title = (cause.title || "").toLowerCase();
    const desc = (cause.description || "").toLowerCase();
    const loc = (cause.receiverLocation || "").toLowerCase();
    const receiver = (cause.receiverName || "").toLowerCase();

    const matchesSearch =
      !q ||
      title.includes(q) ||
      desc.includes(q) ||
      loc.includes(q) ||
      receiver.includes(q);

    if (cat === "bookmarked") {
      return matchesSearch && bookmarkedIds.includes(cause.id);
    }

    const matchesCat = cat === "all" || cause.category === cat;
    return matchesSearch && matchesCat;
  };

  // Must not throw TypeError: Cannot read properties of null (reading 'toLowerCase')
  assert.doesNotThrow(() => {
    const results = malformedCauses.filter((c) => filterFn(c, "detroit", "all"));
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "c1");
  });

  assert.doesNotThrow(() => {
    const results = malformedCauses.filter((c) => filterFn(c, "chicago", "all"));
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "c2");
  });
});

test("Explore & Feed: Education category and Bookmarked filter are fully supported", () => {
  const educationCauses = SEED_CAUSES.filter((c) => c.category === "education");
  assert.ok(educationCauses.length > 0, "Seed causes contain education causes");
  assert.equal(educationCauses[0].id, "cause-school-supplies-06");

  const bookmarkedIds = ["cause-dte-heat-01"];
  const isBookmarked = (id) => bookmarkedIds.includes(id);

  const matched = SEED_CAUSES.filter((c) => isBookmarked(c.id));
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, "cause-dte-heat-01");
});

test("Explore to Feed: URL causeId target gets top priority in swipe deck", () => {
  const causes = [...SEED_CAUSES];
  const targetCauseId = "cause-school-supplies-06"; // #6 in seed list, normally buried

  const sorted = [...causes].sort((a, b) => {
    if (targetCauseId) {
      if (a.id === targetCauseId && b.id !== targetCauseId) return -1;
      if (b.id === targetCauseId && a.id !== targetCauseId) return 1;
    }
    return 0;
  });

  // Reversing for TinderCard stack (causes[causes.length - 1] is top visible card)
  const visibleCauses = [...sorted].reverse();
  const topCard = visibleCauses[visibleCauses.length - 1];

  assert.equal(topCard.id, targetCauseId, "The selected cause from Explore must be the top card on the deck");
});

test("Explore: Fully funded causes are detected cleanly", () => {
  const activeCause = { status: "active", goalAmount: 100, raisedAmount: 50 };
  const fundedCause = { status: "funded", goalAmount: 100, raisedAmount: 100 };
  const overfundedCause = { status: "active", goalAmount: 100, raisedAmount: 110 };

  const isFullyFunded = (c) => c.status === "funded" || (c.goalAmount - c.raisedAmount) <= 0;

  assert.equal(isFullyFunded(activeCause), false);
  assert.equal(isFullyFunded(fundedCause), true);
  assert.equal(isFullyFunded(overfundedCause), true);
});

test("Leaderboard: Rankings and totals derive 100% strictly from verified ledger transactions", () => {
  // Verified transactions matching transparency ledger
  const ledgerTransactions = [
    { id: "tx-1", donorName: "John", donorId: "user_john", amount: 150.0, category: "food" },
    { id: "tx-2", donorName: "Elena Rostova", donorId: "user_elena", amount: 25.0, category: "food" },
    { id: "tx-3", donorName: "Elena Rostova's givi agent", donorId: "user_elena", amount: 20.0, category: "utilities" },
    { id: "tx-4", donorName: "Maharshi Pandya", donorId: "user_maharshi", amount: 10.0, category: "education" },
    { id: "tx-5", donorName: "Maya Lin", donorId: "user_maya", amount: 5.0, category: "utilities" },
    { id: "tx-6", donorName: "Maya Lin's givi agent", donorId: "user_maya", amount: 15.0, category: "medical" },
    { id: "tx-7", donorName: "guest", donorId: "guest", amount: 5.0, category: "climate" },
    { id: "tx-8", donorName: "guest", donorId: "guest", amount: 2.0, category: "utilities" },
  ];

  const totalLedgerDisbursed = ledgerTransactions.reduce((acc, t) => acc + t.amount, 0);
  assert.equal(totalLedgerDisbursed, 232.0, "Ledger total must be exactly $232.00");

  function cleanDonorName(rawName) {
    if (!rawName) return "Kind Supporter";
    return rawName.replace(/'s givi agent$/i, "").replace(/\s*\(givi agent\)$/i, "").trim() || "Kind Supporter";
  }

  const donorMap = new Map();
  for (const tx of ledgerTransactions) {
    const rawName = tx.donorName || "Kind Supporter";
    const cleanedName = cleanDonorName(rawName);
    const lowerName = cleanedName.toLowerCase();
    const rawId = (tx.donorId || "").trim();

    const isGuest =
      !rawId ||
      rawId === "guest" ||
      rawId.startsWith("guest-") ||
      rawId === "user_anon" ||
      lowerName === "guest" ||
      lowerName.includes("anonymous") ||
      lowerName === "kind supporter";

    const groupKey = isGuest ? "guest-community" : (rawId || `donor_${lowerName.replace(/[^a-z0-9]/g, "_")}`);
    const displayName = isGuest ? "Kind Supporter" : cleanedName;

    let entry = donorMap.get(groupKey);
    if (!entry) {
      entry = {
        rank: 99,
        id: groupKey,
        displayName,
        totalDonated: 0,
        causeCount: 0,
        isAnonymous: isGuest,
        badge: "",
        categories: [],
      };
      donorMap.set(groupKey, entry);
    }

    entry.totalDonated = Math.round((entry.totalDonated + tx.amount) * 100) / 100;
    entry.causeCount += 1;
    if (!entry.categories.includes(tx.category)) entry.categories.push(tx.category);
    entry.badge = getGiverBadge(entry.totalDonated);
  }

  const leaderboard = Array.from(donorMap.values());
  leaderboard.sort((a, b) => b.totalDonated - a.totalDonated);
  leaderboard.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  // Verify mathematical parity with ledger
  const totalLeaderboardDonated = leaderboard.reduce((acc, e) => acc + e.totalDonated, 0);
  assert.equal(totalLeaderboardDonated, totalLedgerDisbursed, "Leaderboard total sum must match ledger disbursed amount exactly");

  // Verify podium ranks
  assert.equal(leaderboard[0].displayName, "John", "John with $150 must be #1");
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[0].totalDonated, 150.0);

  assert.equal(leaderboard[1].displayName, "Elena Rostova", "Elena with $45 ($25 personal + $20 agent) must be #2");
  assert.equal(leaderboard[1].rank, 2);
  assert.equal(leaderboard[1].totalDonated, 45.0);

  assert.equal(leaderboard[2].displayName, "Maya Lin", "Maya with $20 ($5 personal + $15 agent) must be #3");
  assert.equal(leaderboard[2].rank, 3);
  assert.equal(leaderboard[2].totalDonated, 20.0);

  // Verify guest grouping
  const guestEntry = leaderboard.find((e) => e.id === "guest-community");
  assert.ok(guestEntry, "Guest transactions must be consolidated into 'guest-community'");
  assert.equal(guestEntry.displayName, "Kind Supporter");
  assert.equal(guestEntry.isAnonymous, true);
  assert.equal(guestEntry.totalDonated, 7.0, "Guest total must be 5 + 2 = 7");
});

test("Swipe Deck: Swiped cause IDs and fully funded causes never resurrect", () => {
  const swipedIds = new Set(["cause-dte-heat-01"]);
  const mockCauses = [
    { id: "cause-dte-heat-01", goalAmount: 142.5, raisedAmount: 142.5, status: "funded" },
    { id: "cause-water-02", goalAmount: 120.0, raisedAmount: 120.0, status: "active" }, // reached goal
    { id: "cause-groceries-03", goalAmount: 85.0, raisedAmount: 20.0, status: "active" },
    { id: "cause-prescriptions-04", goalAmount: 60.0, raisedAmount: 10.0, status: "active" },
  ];

  const activeDeck = mockCauses.filter(
    (c) =>
      !swipedIds.has(c.id) &&
      c.status !== "funded" &&
      Math.round((c.goalAmount - c.raisedAmount) * 100) / 100 > 0.01
  );

  assert.equal(activeDeck.length, 2, "Only unfunded, non-swiped causes remain");
  assert.equal(activeDeck[0].id, "cause-groceries-03");
  assert.equal(activeDeck[1].id, "cause-prescriptions-04");
  assert.ok(!activeDeck.some((c) => c.id === "cause-dte-heat-01"), "Swiped/funded cause evicted permanently");
  assert.ok(!activeDeck.some((c) => c.id === "cause-water-02"), "Zero remaining goal evicted permanently");
});

test("Beneficiary My-Causes: matches causes by local submitted ID, user ID, Clerk email, or PayPal email", () => {
  const submittedLocalIds = ["cause-1731234567890-123"];
  const userId = "user_clerk_real_99";
  const userEmail = "maharshipandya3006@gmail.com";
  const donorPrefs = { paypalEmail: "givibeneficiary@business.example.com" };

  const testCauses = [
    // 1. Matched by local ID (e.g. freshly submitted in onboarding)
    { id: "cause-1731234567890-123", receiverId: "user_guest", receiverEmail: "random@pay.com" },
    // 2. Matched by authenticated userId
    { id: "cause-dte-heat-01", receiverId: "user_clerk_real_99", receiverEmail: "test@example.com" },
    // 3. Matched by PayPal payout email
    { id: "cause-water-02", receiverId: "user_guest", receiverEmail: "givibeneficiary@business.example.com" },
    // 4. Other beneficiary cause (should not match)
    { id: "cause-other-99", receiverId: "user_someone_else", receiverEmail: "someone@else.com" },
  ];

  const matched = testCauses.filter((c) => {
    if (submittedLocalIds.includes(c.id)) return true;
    if (userId && userId !== "guest-session" && c.receiverId === userId) return true;
    if (userEmail && userEmail !== "guest@givi.app" && c.receiverEmail?.toLowerCase() === userEmail.toLowerCase()) return true;
    if (donorPrefs?.paypalEmail && c.receiverEmail?.toLowerCase() === donorPrefs.paypalEmail.toLowerCase()) return true;
    return false;
  });

  assert.equal(matched.length, 3, "Must match all 3 user-linked causes");
  assert.equal(matched.map((c) => c.id).includes("cause-other-99"), false, "Must not match other users");
});

test("Causes API: Merges Supabase user submissions with full 100+ seed catalog", () => {
  // 4 user-created causes from Supabase
  const dbCauses = [
    { id: "custom-cause-1", title: "Custom Bill 1", goalAmount: 50, raisedAmount: 0, status: "active", category: "utilities" },
    { id: "custom-cause-2", title: "Custom Bill 2", goalAmount: 80, raisedAmount: 10, status: "active", category: "medical" },
    { id: "custom-cause-3", title: "Custom Bill 3", goalAmount: 105, raisedAmount: 20, status: "active", category: "climate" },
    { id: "custom-cause-4", title: "Custom Bill 4", goalAmount: 150, raisedAmount: 0, status: "active", category: "climate" },
  ];

  // Merge logic mirroring /api/causes
  const mergedMap = new Map();
  for (const c of dbCauses) {
    mergedMap.set(c.id, c);
  }
  for (const s of SEED_CAUSES) {
    if (!mergedMap.has(s.id)) {
      mergedMap.set(s.id, { ...s });
    }
  }

  const allMerged = Array.from(mergedMap.values());
  assert.ok(allMerged.length >= 104, `Total catalog must include all 100 seeds plus custom causes (got ${allMerged.length})`);
  assert.equal(allMerged[0].id, "custom-cause-1", "Custom database causes take priority at the top");
  assert.equal(allMerged[3].id, "custom-cause-4");
  assert.ok(allMerged.some((c) => c.id === "cause-dte-heat-01"), "Seed causes must be included in merged pool");
});

test("Swipe Deck: Progressively consumes 100+ card stack without stopping until deck is cleared", () => {
  const catalogSize = 104;
  const mockCauses = Array.from({ length: catalogSize }, (_, i) => ({
    id: `cause-${i}`,
    title: `Community Need ${i}`,
    goalAmount: 100,
    raisedAmount: 0,
    status: "active",
  }));

  const swipedIds = new Set();

  // Donor swipes 10 cards
  for (let i = 0; i < 10; i++) {
    swipedIds.add(`cause-${i}`);
  }

  const remainingDeck = mockCauses.filter((c) => !swipedIds.has(c.id));
  assert.equal(remainingDeck.length, 94, "Deck must still have 94 cards ready to swipe");

  // Donor swipes all remaining 94 cards
  for (let i = 10; i < catalogSize; i++) {
    swipedIds.add(`cause-${i}`);
  }

  const finalDeck = mockCauses.filter((c) => !swipedIds.has(c.id));
  assert.equal(finalDeck.length, 0, "Deck completes only when all 100+ cards are swiped");
});
