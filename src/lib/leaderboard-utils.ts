import { getGiverBadge } from "./types.ts";
import {
  cleanDonorName,
  guestIdForUsername,
  isCustomGuestUsername,
  isGenericGuestName,
} from "./guest-identity.ts";

export interface RawLeaderboardTx {
  id: string;
  timestamp: string;
  causeId?: string;
  donorName?: string;
  donorId?: string;
  amount: number;
  category?: string;
}

export interface RawProfileRecord {
  id: string;
  display_name?: string | null;
  displayName?: string | null;
  is_anonymous?: boolean;
  isAnonymous?: boolean;
  total_donated?: number | string | null;
  totalDonated?: number | string | null;
  bills_cleared?: number | string | null;
  billsCleared?: number | string | null;
}

export interface AggregatedLeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  totalDonated: number;
  causeCount: number;
  isAnonymous: boolean;
  avatarUrl?: string;
  badge: string;
  categories: string[];
}

function isJudgeIdentity(rawId: string, cleanedName: string): boolean {
  const lowerName = cleanedName.toLowerCase();
  return (
    rawId === "judge-donor-session" ||
    rawId.startsWith("judge-donor") ||
    rawId.includes("gividonor") ||
    lowerName === "judge donor" ||
    lowerName === "givi donor" ||
    lowerName === "judge" ||
    lowerName.includes("judge donor") ||
    lowerName.includes("givi donor")
  );
}

function isClerkUserId(rawId: string): boolean {
  return rawId.startsWith("user_") && rawId !== "user_anon";
}

function resolveProfileGroupKey(profile: RawProfileRecord): {
  groupKey: string;
  displayName: string;
  isAnonymous: boolean;
} {
  const rawId = (profile.id || "").trim();
  const rawName = (profile.display_name ?? profile.displayName ?? "").trim();
  const cleaned = cleanDonorName(rawName);
  const isAnon = Boolean(profile.is_anonymous ?? profile.isAnonymous);

  if (isJudgeIdentity(rawId, cleaned)) {
    const custom = !isGenericGuestName(cleaned) ? cleaned : "Judge Donor";
    return {
      groupKey: "judge-donor-session",
      displayName: isAnon ? "Anonymous Giver" : custom,
      isAnonymous: isAnon,
    };
  }

  if (isClerkUserId(rawId)) {
    return {
      groupKey: rawId,
      displayName: isAnon
        ? "Anonymous Giver"
        : isCustomGuestUsername(cleaned)
        ? cleaned
        : "Kind Supporter",
      isAnonymous: isAnon,
    };
  }

  if (isCustomGuestUsername(cleaned)) {
    return {
      groupKey: guestIdForUsername(cleaned),
      displayName: isAnon ? "Anonymous Giver" : cleaned,
      isAnonymous: isAnon,
    };
  }

  return {
    groupKey: rawId || "guest-community",
    displayName: isAnon ? "Anonymous Giver" : "Kind Supporter",
    isAnonymous: isAnon || rawId === "guest-community",
  };
}

/**
 * Aggregates ledger transactions and stored profiles into ranked leaderboard entries.
 * Temporary guests and named guest accounts remain isolated rather than merging into a shared bucket.
 */
export function aggregateLeaderboardTransactions(
  transactions: RawLeaderboardTx[],
  profiles: RawProfileRecord[],
  options: {
    isWeekly?: boolean;
    causeCategoryMap?: Map<string, string>;
  } = {}
): AggregatedLeaderboardEntry[] {
  const { isWeekly = false, causeCategoryMap = new Map<string, string>() } = options;
  const donorMap = new Map<string, AggregatedLeaderboardEntry>();

  // Index profiles by raw ID so temporary guest sessions can inherit a profile rename
  const profileByRawId = new Map<string, RawProfileRecord>();
  for (const p of profiles) {
    if (p?.id) profileByRawId.set(p.id, p);
  }

  for (const tx of transactions) {
    if (!tx || tx.amount <= 0) continue;

    const rawName = tx.donorName || "Kind Supporter";
    const cleanedName = cleanDonorName(rawName);
    const rawId = (tx.donorId || "").trim();

    const isJudgeDonor = isJudgeIdentity(rawId, cleanedName);
    const isClerk = !isJudgeDonor && isClerkUserId(rawId);

    // Check if an associated profile renamed this temporary guest session
    const matchedProfile = rawId ? profileByRawId.get(rawId) : undefined;
    const profileCustomName = matchedProfile
      ? cleanDonorName((matchedProfile.display_name ?? matchedProfile.displayName ?? "").trim())
      : "";

    let groupKey: string;
    let displayName: string;
    let isAnonymous = false;

    if (isJudgeDonor) {
      groupKey = "judge-donor-session";
      displayName = isCustomGuestUsername(cleanedName) ? cleanedName : "Judge Donor";
    } else if (isClerk) {
      groupKey = rawId;
      displayName = isCustomGuestUsername(cleanedName) ? cleanedName : "Kind Supporter";
    } else if (isCustomGuestUsername(cleanedName)) {
      // Exact case-sensitive canonical guest bucket per username (e.g. "Mahi" vs "mahi")
      groupKey = guestIdForUsername(cleanedName);
      displayName = cleanedName;
    } else if (isCustomGuestUsername(profileCustomName)) {
      // Previous swipe under a temporary guest-* ID before they named their profile
      groupKey = guestIdForUsername(profileCustomName);
      displayName = profileCustomName;
    } else if (
      rawId &&
      rawId !== "guest-session" &&
      rawId !== "guest" &&
      rawId !== "user_anon"
    ) {
      // Distinct temporary guest session: do not collapse into a unified bucket
      groupKey = rawId;
      displayName = cleanedName === "Kind Supporter" ? "Guest Giver" : cleanedName;
      isAnonymous = cleanedName.toLowerCase().includes("anonymous");
    } else {
      // Legacy un-attributed anonymous rows without a session or username
      groupKey = "guest-community";
      displayName = "Kind Supporter";
      isAnonymous = true;
    }

    let entry = donorMap.get(groupKey);
    if (!entry) {
      entry = {
        rank: 99,
        id: groupKey,
        displayName,
        totalDonated: 0,
        causeCount: 0,
        isAnonymous,
        badge: "",
        categories: [],
      };
      donorMap.set(groupKey, entry);
    } else if (isJudgeDonor && isCustomGuestUsername(displayName)) {
      entry.displayName = displayName;
    }

    entry.totalDonated = Math.round((entry.totalDonated + tx.amount) * 100) / 100;
    entry.causeCount += 1;
    const cat =
      tx.category ||
      (tx.causeId ? causeCategoryMap.get(tx.causeId) : undefined) ||
      "utilities";
    if (!entry.categories.includes(cat)) {
      entry.categories.push(cat);
    }
    entry.badge = getGiverBadge(entry.totalDonated);
  }

  // Enrich with profile anonymity/display names and backfill all-time totals
  for (const profile of profiles) {
    if (!profile?.id || profile.id === "judge-beneficiary-session") continue;

    const resolved = resolveProfileGroupKey(profile);
    const totalDonated = Number(profile.total_donated ?? profile.totalDonated ?? 0) || 0;
    const billsCleared = Number(profile.bills_cleared ?? profile.billsCleared ?? 0) || 0;

    // Update any existing entry mapped by raw ID or canonical guest key
    const existingByCanonical = donorMap.get(resolved.groupKey);
    const existingByRaw = profile.id !== resolved.groupKey ? donorMap.get(profile.id) : undefined;

    if (existingByRaw && existingByCanonical && existingByRaw !== existingByCanonical) {
      // Merge legacy temp-ID bucket into canonical username bucket
      existingByCanonical.totalDonated =
        Math.round((existingByCanonical.totalDonated + existingByRaw.totalDonated) * 100) / 100;
      existingByCanonical.causeCount += existingByRaw.causeCount;
      for (const cat of existingByRaw.categories) {
        if (!existingByCanonical.categories.includes(cat)) {
          existingByCanonical.categories.push(cat);
        }
      }
      donorMap.delete(profile.id);
    } else if (existingByRaw && !existingByCanonical) {
      existingByRaw.id = resolved.groupKey;
      donorMap.delete(profile.id);
      donorMap.set(resolved.groupKey, existingByRaw);
    }

    let entry = donorMap.get(resolved.groupKey);
    if (entry) {
      if (resolved.isAnonymous) {
        entry.isAnonymous = true;
        entry.displayName = "Anonymous Giver";
      } else if (isCustomGuestUsername(resolved.displayName)) {
        entry.displayName = resolved.displayName;
        entry.isAnonymous = false;
      }

      if (!isWeekly && totalDonated > 0) {
        entry.totalDonated = Math.max(entry.totalDonated, Math.round(totalDonated * 100) / 100);
        entry.causeCount = Math.max(entry.causeCount, Math.max(1, billsCleared));
        entry.badge = getGiverBadge(entry.totalDonated);
      }
    } else if (!isWeekly && totalDonated > 0) {
      const rounded = Math.round(totalDonated * 100) / 100;
      donorMap.set(resolved.groupKey, {
        rank: 99,
        id: resolved.groupKey,
        displayName: resolved.displayName,
        totalDonated: rounded,
        causeCount: Math.max(1, billsCleared),
        isAnonymous: resolved.isAnonymous,
        badge: getGiverBadge(rounded),
        categories: ["utilities"],
      });
    }
  }

  return Array.from(donorMap.values());
}

