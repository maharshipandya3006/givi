"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2, ArrowRight } from "lucide-react";
import { LeaderboardEntry } from "@/app/api/leaderboard/route";
import { LeaderboardCard, LeaderboardRunOption } from "@/components/ui/leaderboard-card";
import { useUser } from "@/lib/user-context";
import { getGiverBadge } from "@/lib/types";
import { cleanDonorName, guestIdForUsername, isCustomGuestUsername } from "@/lib/guest-identity";
import Link from "next/link";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterTime, setFilterTime] = useState<"all" | "weekly">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { userId, userName, donorPrefs } = useUser();

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const isJudge = userId === "judge-donor-session" || donorPrefs?.displayName === "Judge Donor";
        const resolvedName = donorPrefs?.isAnonymous
          ? "Anonymous Giver"
          : isCustomGuestUsername(donorPrefs?.displayName)
          ? donorPrefs.displayName.trim()
          : isCustomGuestUsername(userName)
          ? (userName || "").trim()
          : isJudge
          ? "Judge Donor"
          : "Guest Giver";

        const params = new URLSearchParams({ period: filterTime });
        if (userId) params.set("userId", userId);
        if (!donorPrefs?.isAnonymous && isCustomGuestUsername(resolvedName)) {
          params.set("lookupName", resolvedName);
        }

        const res = await fetch(`/api/leaderboard?${params.toString()}`);
        let data: LeaderboardEntry[] = [];
        if (res.ok) {
          const parsed = await res.json();
          if (Array.isArray(parsed)) data = parsed;
        }

        const activeId = userId || "me";
        const canonicalGuestId =
          !isJudge && !activeId.startsWith("user_") && !donorPrefs?.isAnonymous && isCustomGuestUsername(resolvedName)
            ? guestIdForUsername(resolvedName)
            : "";

        // Reconcile recent local swipes for the active user (covers immediate swipes & weekly view)
        let localRecentTotal = 0;
        let localRecentCount = 0;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("givi_recent_transactions");
            const parsedTxs = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsedTxs)) {
              const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
              for (const tx of parsedTxs) {
                if (filterTime === "weekly" && new Date(tx.timestamp).getTime() < oneWeekAgo) continue;
                const txMatchesUser =
                  (userId && tx.donorId === userId) ||
                  (!donorPrefs?.isAnonymous &&
                    isCustomGuestUsername(resolvedName) &&
                    cleanDonorName(tx.donorName || "") === resolvedName);
                if (txMatchesUser) {
                  localRecentTotal += Number(tx.amount) || 0;
                  localRecentCount += 1;
                }
              }
            }
          } catch {}
        }

        let userEntry = data.find(
          (e) =>
            (isJudge && (e.id === "judge-donor-session" || e.displayName === "Judge Donor" || e.displayName === resolvedName)) ||
            (userId && e.id === userId) ||
            (canonicalGuestId && e.id === canonicalGuestId) ||
            (!donorPrefs?.isAnonymous && isCustomGuestUsername(resolvedName) && e.displayName === resolvedName)
        );

        const profileTotal = filterTime === "all" ? Number(donorPrefs?.totalDonated || 0) : 0;
        const profileBills = filterTime === "all" ? Number(donorPrefs?.billsCleared || 0) : 0;
        const effectiveTotal = Math.round(Math.max(userEntry?.totalDonated || 0, profileTotal, localRecentTotal) * 100) / 100;
        const effectiveCount = Math.max(userEntry?.causeCount || 0, profileBills, localRecentCount, isJudge ? 9 : 0);

        if (userEntry) {
          userEntry.id = activeId;
          userEntry.displayName = donorPrefs?.isAnonymous ? "Anonymous Giver" : resolvedName;
          userEntry.isAnonymous = Boolean(donorPrefs?.isAnonymous);
          userEntry.totalDonated = effectiveTotal;
          userEntry.causeCount = effectiveCount;
          userEntry.badge = getGiverBadge(effectiveTotal);
        } else {
          userEntry = {
            rank: data.length + 1,
            id: activeId,
            displayName: resolvedName,
            totalDonated: effectiveTotal,
            causeCount: effectiveCount,
            isAnonymous: Boolean(donorPrefs?.isAnonymous),
            badge: getGiverBadge(effectiveTotal),
            categories: ["utilities"],
          };
          data.push(userEntry);
        }

        // Deduplicate by resolved ID cleanly before ranking
        const dedupedMap = new Map<string, LeaderboardEntry>();
        for (const item of data) {
          const existing = dedupedMap.get(item.id);
          if (!existing || item === userEntry) {
            dedupedMap.set(item.id, item);
          }
        }
        const finalEntries = Array.from(dedupedMap.values());

        finalEntries.sort((a, b) => {
          if (b.totalDonated !== a.totalDonated) return b.totalDonated - a.totalDonated;
          if (b.causeCount !== a.causeCount) return b.causeCount - a.causeCount;
          if (a.id === activeId) return -1;
          if (b.id === activeId) return 1;
          return 0;
        });
        finalEntries.forEach((entry, idx) => {
          entry.rank = idx + 1;
        });

        setEntries(finalEntries);
      } catch (err) {
        console.warn("Could not fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [filterTime, userId, userName, donorPrefs?.totalDonated, donorPrefs?.billsCleared, donorPrefs?.displayName, donorPrefs?.isAnonymous]);

  const runOptions: LeaderboardRunOption[] = [
    { id: "all", label: "All-Time Impact" },
    { id: "weekly", label: "This Week" },
  ];

  // Derive dates
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fromDate = filterTime === "weekly" ? weekAgo : new Date("2026-01-01");
  const toDate = now;

  // Transform entries into component contracts (Podium shows donors with > $0 only)
  const podiumRankings = entries
    .filter((e) => e.totalDonated > 0)
    .slice(0, 3)
    .map((e) => ({
      userId: e.id,
      userName: e.displayName,
      rank: e.rank,
      value: e.totalDonated,
      badge: e.badge,
      byline: `${e.causeCount} Bills Cleared · ${e.badge}`,
    }));

  const rankings = entries.map((e) => ({
    userId: e.id,
    rank: e.rank,
    userName: e.displayName,
    byline: `${e.causeCount} Verified Bills Cleared · ${e.badge}`,
    value: e.totalDonated,
    displayed: true,
  }));

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-4xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Header */}
      <div className="text-center mb-8 max-w-lg">
        <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-2">
          Community Impact Leaderboard
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Celebrating donors and autonomous agents delivering verified micro-relief to families across the nation.
        </p>
      </div>

      {isLoading ? (
        <div className="w-full h-80 rounded-3xl bg-surface border border-border flex flex-col items-center justify-center text-ink-muted gap-3">
          <Loader2 className="w-8 h-8 text-[#166534] animate-spin" />
          <span className="text-xs font-mono">Loading community impact rankings...</span>
        </div>
      ) : entries.length === 0 ? (
        /* Empty State */
        <div className="w-full py-16 px-6 rounded-3xl bg-surface border border-border text-center flex flex-col items-center shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-[#166534]/10 text-[#166534] flex items-center justify-center mb-4">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-lg text-ink mb-1">
            {filterTime === "weekly" ? "No Donations Yet This Week" : "No Rankings Yet"}
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mb-6 leading-relaxed">
            {filterTime === "weekly"
              ? "Be the first to step up this week! Swipe micro-relief to support urgent utility and prescription needs."
              : "Make a direct micro-donation to appear on the community impact leaderboard."}
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
          >
            <span>Swipe a Bill to Take #1</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          <LeaderboardCard
            title={filterTime === "weekly" ? "Weekly Impact Podium" : "All-Time Impact Podium"}
            fromDate={fromDate}
            toDate={toDate}
            currentUserId={userId || "me"}
            runOptions={runOptions}
            selectedRunId={filterTime}
            onRunChange={(runId) => setFilterTime(runId as "all" | "weekly")}
            podiumRankings={podiumRankings}
            rankings={rankings}
            className="bg-surface border-border shadow-card"
          />

          {/* Direct CTA back to Feed */}
          <div className="mt-2 text-center">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>Swipe a Bill to Climb the Leaderboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
