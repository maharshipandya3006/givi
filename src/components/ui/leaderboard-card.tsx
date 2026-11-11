"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LeaderboardPodium,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from "@/components/ui/leaderboard-podium";
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
} from "@/components/ui/leaderboard-rankings";
import { Sparkles, Shield, HeartHandshake } from "lucide-react";

interface LeaderboardRunOption {
  id: string;
  label: string;
}

interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  fromDate: string | Date;
  toDate: string | Date;
  podiumRankings: LeaderboardPodiumRanking[];
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  runOptions?: LeaderboardRunOption[];
  selectedRunId?: string;
  onRunChange?: (runId: string) => void;
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title = "Leaderboard",
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      ...props
    },
    ref
  ) => {
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? "";
    const hasOnRunChange = Boolean(onRunChange);
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId);

    React.useEffect(() => {
      if (hasOnRunChange) return;
      setLocalRunId(resolvedRunId);
    }, [hasOnRunChange, resolvedRunId]);

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId;

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-3xl border border-white/60 dark:border-white/10 bg-surface/70 backdrop-blur-3xl p-6 sm:p-10 shadow-card transition-all overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Specular top border illumination line (Apple WWDC glass highlight) */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        {/* Ambient background blur accent */}
        <div className="absolute -top-24 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Header Bar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
              {title}
            </h3>
          </div>

          {/* Floating Segmented Island (Apple iOS Fluid Segment) */}
          {runOptions && runOptions.length > 0 ? (
            <div className="inline-flex items-center p-1 rounded-2xl bg-surface-elevated/90 backdrop-blur-md border border-border/80 shadow-xs self-start sm:self-auto">
              {runOptions.map((option) => {
                const isSelected = activeRunId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (onRunChange) {
                        onRunChange(option.id);
                        return;
                      }
                      setLocalRunId(option.id);
                    }}
                    className={cn(
                      "relative px-4 sm:px-5 py-2 rounded-xl text-xs font-bold tracking-tight transition-colors duration-200 focus-visible:outline-none select-none",
                      isSelected
                        ? "text-white"
                        : "text-ink-muted hover:text-ink active:scale-95"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeLeaderboardSegment"
                        transition={{
                          type: "spring",
                          damping: 24,
                          stiffness: 320,
                        }}
                        className="absolute inset-0 bg-[#166534] rounded-xl shadow-emerald-sm"
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Podium Area with Physical Depth & Lighting */}
        <LeaderboardPodium
          rankings={podiumRankings}
          currentUserId={currentUserId}
          className="mb-10"
        />

        {/* Paginated Rankings List with Momentum Springs */}
        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
        />
      </div>
    );
  }
);

LeaderboardCard.displayName = "LeaderboardCard";

export { LeaderboardCard };
export type { LeaderboardCardProps, LeaderboardRunOption };
