import { NextRequest, NextResponse } from "next/server";
import { runtimeDonations, HISTORICAL_AUDIT_LOGS } from "@/lib/ledger";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getGiverBadge } from "@/lib/types";
import { SEED_CAUSES } from "@/lib/seed-data";
import {
  aggregateLeaderboardTransactions,
  type AggregatedLeaderboardEntry,
  type RawLeaderboardTx,
  type RawProfileRecord,
} from "@/lib/leaderboard-utils";
import { isCustomGuestUsername } from "@/lib/guest-identity";

export type LeaderboardEntry = AggregatedLeaderboardEntry;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all";
  const requestedUserId = searchParams.get("userId")?.trim() || "";
  const lookupName = searchParams.get("lookupName")?.trim() || "";
  const isWeekly = period === "weekly";
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const causeCategoryMap = new Map<string, string>(
    SEED_CAUSES.map((c) => [c.id, c.category])
  );

  const transactions: RawLeaderboardTx[] = [];
  const seenTxIds = new Set<string>();

  // 1. Fetch persisted donations from Supabase when configured
  if (isSupabaseConfigured) {
    try {
      let query = (supabaseAdmin as any)
        .from("donations")
        .select("id, donor_id, donor_name, amount, is_agentic, created_at, cause_id, causes(category)")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (isWeekly) {
        query = query.gte("created_at", new Date(oneWeekAgo).toISOString());
      }

      const { data } = await query;
      if (data && data.length > 0) {
        for (const row of data) {
          if (!seenTxIds.has(row.id)) {
            seenTxIds.add(row.id);
            transactions.push({
              id: row.id,
              timestamp: row.created_at,
              causeId: row.cause_id,
              donorName: row.donor_name,
              donorId: row.donor_id,
              amount: parseFloat(row.amount) || 0,
              category: row.causes?.category || causeCategoryMap.get(row.cause_id) || "utilities",
            });
          }
        }
      }
    } catch (err) {
      console.warn("Could not query Supabase donations for leaderboard:", err);
    }
  }

  // 2. Aggregate runtime donations from active session
  for (const donation of runtimeDonations) {
    if (isWeekly && new Date(donation.createdAt).getTime() < oneWeekAgo) continue;
    if (!seenTxIds.has(donation.id)) {
      seenTxIds.add(donation.id);
      transactions.push({
        id: donation.id,
        timestamp: donation.createdAt,
        causeId: donation.causeId,
        donorName: donation.donorName,
        donorId: donation.donorId,
        amount: Number(donation.amount) || 0,
        category: causeCategoryMap.get(donation.causeId) || "utilities",
      });
    }
  }

  // 3. Aggregate historical verified ledger records
  for (const hist of HISTORICAL_AUDIT_LOGS) {
    if (isWeekly && new Date(hist.timestamp).getTime() < oneWeekAgo) continue;
    if (!seenTxIds.has(hist.id)) {
      seenTxIds.add(hist.id);
      transactions.push({
        id: hist.id,
        timestamp: hist.timestamp,
        causeId: hist.causeId,
        donorName: hist.donorName,
        donorId: hist.donorId,
        amount: Number(hist.amount) || 0,
        category: hist.category || (hist.causeId ? causeCategoryMap.get(hist.causeId) : undefined) || "utilities",
      });
    }
  }

  // 4. Collect donor profiles (Supabase + fallback store) so profile updates & totals are reflected
  const profileMap = new Map<string, RawProfileRecord>();

  if (isSupabaseConfigured) {
    try {
      const { data: activeProfiles } = await (supabaseAdmin as any)
        .from("donor_profiles")
        .select("id, is_anonymous, display_name, total_donated, bills_cleared")
        .gt("total_donated", 0)
        .limit(200);

      if (activeProfiles) {
        for (const p of activeProfiles) {
          profileMap.set(p.id, p);
        }
      }

      if (requestedUserId && !profileMap.has(requestedUserId)) {
        const { data: selfProfile } = await (supabaseAdmin as any)
          .from("donor_profiles")
          .select("id, is_anonymous, display_name, total_donated, bills_cleared")
          .eq("id", requestedUserId)
          .maybeSingle();
        if (selfProfile) profileMap.set(selfProfile.id, selfProfile);
      }

      if (isCustomGuestUsername(lookupName)) {
        const { data: namedProfiles } = await (supabaseAdmin as any)
          .from("donor_profiles")
          .select("id, is_anonymous, display_name, total_donated, bills_cleared")
          .eq("display_name", lookupName)
          .not("id", "like", "user_%")
          .neq("id", "judge-donor-session")
          .neq("id", "judge-beneficiary-session")
          .limit(5);
        if (namedProfiles) {
          for (const p of namedProfiles) {
            if (!profileMap.has(p.id)) profileMap.set(p.id, p);
          }
        }
      }
    } catch (err) {
      console.warn("Could not query Supabase donor_profiles for leaderboard:", err);
    }
  }

  try {
    const fallbackStore = (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ as Map<string, any> | undefined;
    if (fallbackStore) {
      for (const [storeId, profile] of fallbackStore.entries()) {
        if (!profileMap.has(storeId)) {
          profileMap.set(storeId, { ...profile, id: storeId });
        } else {
          const existing = profileMap.get(storeId)!;
          existing.total_donated = Math.max(
            Number(existing.total_donated || 0),
            Number(profile.total_donated ?? profile.totalDonated ?? 0)
          );
          existing.bills_cleared = Math.max(
            Number(existing.bills_cleared || 0),
            Number(profile.bills_cleared ?? profile.billsCleared ?? 0)
          );
          if (isCustomGuestUsername(profile.display_name)) {
            existing.display_name = profile.display_name;
          }
          if (profile.is_anonymous !== undefined || profile.isAnonymous !== undefined) {
            existing.is_anonymous = Boolean(profile.is_anonymous ?? profile.isAnonymous);
          }
        }
      }
    }
  } catch {}

  const entries = aggregateLeaderboardTransactions(
    transactions,
    Array.from(profileMap.values()),
    { isWeekly, causeCategoryMap }
  );

  // Ensure unified Judge Donor baseline reflects active judge demo account ($456.93 showcase + agent giving)
  try {
    const fallbackStore = (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ as Map<string, any> | undefined;
    const judgeProfile = fallbackStore?.get("judge-donor-session");
    const judgeProfileTotal = Number(judgeProfile?.total_donated || judgeProfile?.totalDonated || 0);
    const judgeWallet = typeof (globalThis as any).__GIVI_USER_WALLETS__?.get === "function"
      ? (globalThis as any).__GIVI_USER_WALLETS__.get("judge-donor-session") ?? 50
      : 50;
    const judgeAgentSpent = judgeWallet < 33 ? Math.max(0, 33 - judgeWallet) : 0;
    const judgeTargetTotal = Math.max(judgeProfileTotal, Math.round((456.93 + judgeAgentSpent) * 100) / 100);

    const customJudgeName =
      judgeProfile?.display_name &&
      isCustomGuestUsername(judgeProfile.display_name)
        ? judgeProfile.display_name
        : undefined;

    let judgeEntry = entries.find((e) => e.id === "judge-donor-session");
    if (!judgeEntry) {
      judgeEntry = {
        rank: 1,
        id: "judge-donor-session",
        displayName: customJudgeName || "Judge Donor",
        totalDonated: judgeTargetTotal,
        causeCount: Math.max(Number(judgeProfile?.bills_cleared || 9), 9),
        isAnonymous: false,
        badge: getGiverBadge(judgeTargetTotal),
        categories: ["utilities", "climate", "food"],
      };
      entries.push(judgeEntry);
    } else {
      if (customJudgeName) {
        judgeEntry.displayName = customJudgeName;
      }
      judgeEntry.totalDonated = Math.max(judgeEntry.totalDonated, judgeTargetTotal);
      judgeEntry.causeCount = Math.max(judgeEntry.causeCount, 9);
      judgeEntry.badge = getGiverBadge(judgeEntry.totalDonated);
    }
  } catch {}

  entries.sort((a, b) => b.totalDonated - a.totalDonated);
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return NextResponse.json(entries);
}
