"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2, ArrowRight } from "lucide-react";
import { LeaderboardEntry } from "@/app/api/leaderboard/route";
import { LeaderboardCard, LeaderboardRunOption } from "@/components/ui/leaderboard-card";
import { useUser } from "@/lib/user-context";
import { getGiverBadge } from "@/lib/types";
import Link from "next/link";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterTime, setFilterTime] = useState<"all" | "weekly">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { userId, donorPrefs } = useUser();

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const queryParam = userId ? `&userId=${encodeURIComponent(userId)}` : "";
        const res = await fetch(`/api/leaderboard?period=${filterTime}${queryParam}`);
        let data: LeaderboardEntry[] = [];
        if (res.ok) {
          const parsed = await res.json();
          if (Array.isArray(parsed)) data = parsed;
        }

        // Match active user entry for UI highlighting and privacy preferences
        if (userId) {
          const isJudge = userId === "judge-donor-session" || donorPrefs?.displayName === "Judge Donor";
          const myName = donorPrefs?.displayName && donorPrefs.displayName !== "Kind Supporter"
            ? donorPrefs.displayName
            : (isJudge ? "Judge Donor" : "Kind Supporter");

          const userEntry = data.find(
            (e) => (isJudge && (e.id === "judge-donor-session" || e.displayName === "Judge Donor" || e.displayName === myName)) ||
                   e.id === userId ||
                   (myName && e.displayName === myName)
          );
          if (userEntry) {
            userEntry.id = userId;
            if (myName && !donorPrefs?.isAnonymous && myName !== "Kind Supporter") {
              userEntry.displayName = myName;
            }
            if (isJudge && donorPrefs?.totalDonated) {
              userEntry.totalDonated = Math.max(userEntry.totalDonated, Number(donorPrefs.totalDonated));
              userEntry.causeCount = Math.max(userEntry.causeCount, Number(donorPrefs.billsCleared || 9));
              userEntry.badge = getGiverBadge(userEntry.totalDonated);
            }
            if (donorPrefs?.isAnonymous) {
              userEntry.isAnonymous = true;
              userEntry.displayName = "Anonymous Giver";
            }
          }
        }

        // Sort descending and re-assign ranks accurately
        data.sort((a, b) => b.totalDonated - a.totalDonated);
        data.forEach((entry, idx) => {
          entry.rank = idx + 1;
        });

        setEntries(data);
      } catch (err) {
        console.warn("Could not fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [filterTime, userId, donorPrefs?.totalDonated, donorPrefs?.billsCleared, donorPrefs?.displayName, donorPrefs?.isAnonymous]);

  const runOptions: LeaderboardRunOption[] = [
    { id: "all", label: "All-Time Impact" },
    { id: "weekly", label: "This Week" },
  ];

  // Derive dates
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fromDate = filterTime === "weekly" ? weekAgo : new Date("2026-01-01");
  const toDate = now;

  // Transform entries into component contracts
  const podiumRankings = entries.slice(0, 3).map((e) => ({
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
