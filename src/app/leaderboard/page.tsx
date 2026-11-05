"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LeaderboardEntry } from "@/app/api/leaderboard/route";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterTime, setFilterTime] = useState<"all" | "weekly">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (err) {
        console.warn("Could not fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#118C4F]/10 border border-[#118C4F]/30 text-[#118C4F] text-xs font-semibold mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Community Impact Podium</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Impact Leaderboard</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          Celebrating donors and autonomous agents driving real-world good through verified micro-payouts.
        </p>

        {/* Time Tabs */}
        <div className="inline-flex items-center gap-1 bg-zinc-950 p-1 rounded-full border border-[#1f1f23] mt-5">
          <button
            onClick={() => setFilterTime("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterTime === "all"
                ? "bg-[#118C4F] text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All-Time High
          </button>
          <button
            onClick={() => setFilterTime("weekly")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterTime === "weekly"
                ? "bg-[#118C4F] text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-zinc-500 text-xs">Loading leaderboard...</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8 items-end">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="order-2 sm:order-1 p-5 rounded-3xl bg-zinc-950 border border-[#1f1f23] text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#1f1f23] flex items-center justify-center text-zinc-300 font-bold mb-3 shadow font-mono text-sm">
                  #2
                </div>
                <h3 className="font-bold text-sm text-white">{topThree[1].displayName}</h3>
                <span className="text-[11px] font-mono text-zinc-500 mb-2">
                  {topThree[1].causeCount} Needs Funded
                </span>
                <span className="text-lg font-bold font-mono text-[#118C4F]">
                  {formatCurrency(topThree[1].totalDonated)}
                </span>
                <span className="text-[10px] mt-2 px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-[#1f1f23]">
                  {topThree[1].badge}
                </span>
              </div>
            )}

            {/* 1st Place (Champion) */}
            {topThree[0] && (
              <div className="order-1 sm:order-2 p-6 rounded-3xl bg-zinc-950 border border-[#118C4F]/40 text-center flex flex-col items-center shadow-xl shadow-[#118C4F]/10 sm:-translate-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#118C4F] flex items-center justify-center text-white font-extrabold text-base mb-3 shadow-lg shadow-[#118C4F]/30 font-mono">
                  #1
                </div>
                <h3 className="font-extrabold text-base text-white">{topThree[0].displayName}</h3>
                <span className="text-xs font-mono text-zinc-400 mb-2">
                  {topThree[0].causeCount} Needs Funded
                </span>
                <span className="text-2xl font-extrabold font-mono text-[#118C4F]">
                  {formatCurrency(topThree[0].totalDonated)}
                </span>
                <span className="text-[11px] font-semibold mt-2 px-2.5 py-0.5 rounded-full bg-[#118C4F]/20 text-white border border-[#118C4F]/40">
                  {topThree[0].badge}
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="order-3 p-5 rounded-3xl bg-zinc-950 border border-[#1f1f23] text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#1f1f23] flex items-center justify-center text-zinc-400 font-bold mb-3 shadow font-mono text-sm">
                  #3
                </div>
                <h3 className="font-bold text-sm text-white">{topThree[2].displayName}</h3>
                <span className="text-[11px] font-mono text-zinc-500 mb-2">
                  {topThree[2].causeCount} Needs Funded
                </span>
                <span className="text-lg font-bold font-mono text-[#118C4F]">
                  {formatCurrency(topThree[2].totalDonated)}
                </span>
                <span className="text-[10px] mt-2 px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-[#1f1f23]">
                  {topThree[2].badge}
                </span>
              </div>
            )}
          </div>

          {/* Remaining Rankings List */}
          <div className="w-full bg-zinc-950 border border-[#1f1f23] rounded-2xl overflow-hidden divide-y divide-[#1f1f23]">
            {remaining.map((entry) => (
              <div
                key={entry.id}
                className="p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-mono font-bold text-zinc-500 text-sm">
                    #{entry.rank}
                  </span>
                  <div>
                    <span className="font-semibold text-xs sm:text-sm text-white block">
                      {entry.displayName}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {entry.causeCount} Causes · {entry.badge}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold font-mono text-sm text-[#118C4F] block">
                    {formatCurrency(entry.totalDonated)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
