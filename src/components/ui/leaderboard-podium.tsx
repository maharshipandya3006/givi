"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, ShieldCheck } from "lucide-react";

export interface LeaderboardRanking {
  userId: string;
  userName: string;
  rank: number;
  value: number;
  avatarUrl?: string;
  badge?: string;
  byline?: string;
}

interface LeaderboardPodiumProps extends React.HTMLAttributes<HTMLDivElement> {
  rankings: LeaderboardRanking[];
}

export const LeaderboardPodium = React.forwardRef<HTMLDivElement, LeaderboardPodiumProps>(
  ({ className, rankings, ...props }, ref) => {
    if (!rankings || rankings.length === 0) return null;

    const top1 = rankings.find((r) => r.rank === 1) || rankings[0];
    const top2 = rankings.find((r) => r.rank === 2) || rankings[1];
    const top3 = rankings.find((r) => r.rank === 3) || rankings[2];

    const podiumOrder = [top2, top1, top3].filter(Boolean) as LeaderboardRanking[];

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full flex items-end justify-center gap-3 sm:gap-6 pt-10 pb-4 overflow-visible",
          className
        )}
        {...props}
      >
        {/* Subtle Ambient Apple-style Depth Glow for the Arena */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none rounded-full -z-10" />

        <AnimatePresence mode="popLayout">
          {podiumOrder.map((entry) => {
            const isFirst = entry.rank === 1;
            const isSecond = entry.rank === 2;

            // Pillar height and Apple material hierarchy
            const pillarHeight = isFirst
              ? "h-52 sm:h-64"
              : isSecond
              ? "h-40 sm:h-48"
              : "h-32 sm:h-40";

            return (
              <motion.div
                key={entry.userId}
                layout
                initial={{ opacity: 0, y: 35, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.92 }}
                transition={{
                  type: "spring",
                  damping: 22,
                  stiffness: 280,
                }}
                className={cn(
                  "relative flex-1 min-w-0 max-w-[210px] flex flex-col items-center text-center select-none group",
                  isFirst && "order-2 -translate-y-4 sm:-translate-y-6 z-20",
                  isSecond && "order-1 z-10",
                  !isFirst && !isSecond && "order-3 z-10"
                )}
              >
                {/* 1. Halo & Floating Medallion */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", damping: 18, stiffness: 400 }}
                  className="relative mb-3 cursor-pointer"
                >
                  {isFirst ? (
                    <div className="relative">
                      {/* Radiating specular glow */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/40 via-green-500/30 to-emerald-600/40 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Obsidian Emerald Monolith Avatar */}
                      <div className="relative w-15 h-15 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-b from-[#1b7a40] via-[#166534] to-[#0f3d20] text-white flex flex-col items-center justify-center shadow-emerald-lg ring-1 ring-white/40 border border-emerald-300/30">
                        <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-200 fill-emerald-200/25 drop-shadow-sm" />
                      </div>

                      {/* Gold Laurel Rank Pip */}
                      <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-gradient-to-r from-amber-400 to-amber-500 text-stone-900 shadow-md ring-2 ring-white/90">
                        #1
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-surface/90 backdrop-blur-xl border border-white/60 dark:border-white/10 flex items-center justify-center text-ink shadow-sm ring-1 ring-black/5">
                        <span className="font-mono font-black text-sm text-ink-dim">
                          {entry.userName.slice(0, 1).toUpperCase()}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black font-mono flex items-center justify-center shadow-xs ring-2 ring-white/80",
                          isSecond ? "bg-slate-700 text-white" : "bg-amber-900 text-amber-100"
                        )}
                      >
                        {entry.rank}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* 2. Donor Identity with Apple Optical Typography */}
                <div className="w-full px-0.5 mb-1.5">
                  <h4
                    className={cn(
                      "font-black tracking-tight truncate",
                      isFirst ? "text-sm sm:text-base text-ink" : "text-xs sm:text-sm text-ink"
                    )}
                    title={entry.userName}
                  >
                    {entry.userName}
                  </h4>
                  
                  {entry.byline && (
                    <span
                      className="text-[10px] text-ink-muted font-mono tracking-tight block mt-0.5 whitespace-normal break-words leading-tight"
                      title={entry.byline}
                    >
                      {entry.byline}
                    </span>
                  )}
                </div>

                {/* 3. Value Display */}
                <motion.div
                  layout
                  className="mb-3 px-3 py-0.5 rounded-full bg-surface-elevated/70 border border-border/60 shadow-xs"
                >
                  <span className="text-xs sm:text-sm font-black font-mono text-[#166534] tabular-nums tracking-tight">
                    {formatCurrency(entry.value)}
                  </span>
                </motion.div>

                {/* 4. Translucent Frosted Glass Physical Monolith Pillar */}
                <div
                  className={cn(
                    "relative w-full rounded-3xl border backdrop-blur-2xl flex flex-col items-center justify-end p-3.5 transition-all duration-300 overflow-hidden",
                    pillarHeight,
                    isFirst
                      ? "bg-gradient-to-t from-[#166534]/35 via-emerald-500/15 to-white/70 dark:to-emerald-900/30 border-[#166534]/40 shadow-emerald-md"
                      : isSecond
                      ? "bg-gradient-to-t from-slate-500/15 via-surface/80 to-white/60 dark:to-slate-800/20 border-border/80 shadow-xs"
                      : "bg-gradient-to-t from-amber-600/10 via-surface/60 to-white/50 dark:to-amber-950/20 border-border/70 shadow-xs"
                  )}
                >
                  {/* Subtle top edge specular reflection line (WWDC Material lighting) */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                  {/* Micro badge inside pillar base */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-mono font-black text-ink-dim tracking-wider">
                      PODIUM #{entry.rank}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest font-mono text-ink-muted/80">
                      {isFirst ? "COMMUNITY LEADER" : "VERIFIED GIVER"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }
);

LeaderboardPodium.displayName = "LeaderboardPodium";
