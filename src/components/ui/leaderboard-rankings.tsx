"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";

export interface LeaderboardRankingItem {
  userId: string;
  rank: number;
  userName: string;
  byline?: string;
  value: number;
  displayed?: boolean;
  avatarUrl?: string;
}

interface LeaderboardRankingsProps extends React.HTMLAttributes<HTMLDivElement> {
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  showPagination?: boolean;
  defaultPageSize?: number;
}

export const LeaderboardRankings = React.forwardRef<HTMLDivElement, LeaderboardRankingsProps>(
  (
    {
      className,
      rankings,
      currentUserId,
      showPagination = true,
      defaultPageSize = 10,
      ...props
    },
    ref
  ) => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = defaultPageSize;
    const totalPages = Math.max(1, Math.ceil(rankings.length / pageSize));

    React.useEffect(() => {
      if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = showPagination
      ? rankings.slice(startIndex, startIndex + pageSize)
      : rankings;

    const isMatchingUser = React.useCallback(
      (item: LeaderboardRankingItem) =>
        Boolean(currentUserId) &&
        (item.userId === currentUserId || item.userId === `user_${currentUserId}`),
      [currentUserId]
    );

    const currentUserIndex = rankings.findIndex(isMatchingUser);
    const currentUserItem = currentUserIndex >= 0 ? rankings[currentUserIndex] : undefined;
    const currentUserPage = currentUserIndex >= 0 ? Math.floor(currentUserIndex / pageSize) + 1 : 1;
    const isCurrentOnCurrentPage = paginatedItems.some(isMatchingUser);
    const shouldPinStanding =
      Boolean(currentUserItem) && (!isCurrentOnCurrentPage || (currentUserItem?.value ?? 0) <= 0);

    return (
      <div ref={ref} className={cn("w-full flex flex-col gap-3.5", className)} {...props}>
        {shouldPinStanding && currentUserItem && (
          <div className="rounded-2xl border border-[#166534]/35 border-l-[5px] border-l-[#166534] bg-[#166534]/10 p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="font-mono font-black text-xs">
                  {currentUserItem.value > 0 ? `#${currentUserItem.rank}` : "—"}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#166534]">
                    Your Standing
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-ink tracking-tight truncate">
                    {currentUserItem.userName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#166534] text-white tracking-tight shadow-xs">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>You</span>
                  </span>
                </div>
                {currentUserItem.byline && (
                  <span className="text-[11px] text-ink-muted font-mono tracking-tight truncate block mt-0.5">
                    {currentUserItem.byline}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 pl-2 flex flex-col items-end gap-1">
              <span className="font-mono font-black text-xs sm:text-sm text-[#166534] tabular-nums tracking-tight">
                {formatCurrency(currentUserItem.value)}
              </span>
              {!isCurrentOnCurrentPage && currentUserPage !== currentPage ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentUserPage)}
                  className="text-[10px] font-bold text-[#166534] hover:underline font-mono cursor-pointer"
                >
                  Jump to #{currentUserItem.rank} →
                </button>
              ) : (
                <span className="text-[10px] text-ink-muted/80 font-mono tracking-tight">
                  {currentUserItem.value > 0 ? "Verified Impact" : "Swipe a bill to rank"}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-border/80 divide-y divide-border/60 overflow-hidden bg-surface/75 backdrop-blur-2xl shadow-sm">
          <AnimatePresence mode="popLayout" initial={false}>
            {paginatedItems.map((item, index) => {
              const isCurrent = isMatchingUser(item);

              return (
                <motion.div
                  key={item.userId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    type: "spring",
                    damping: 26,
                    stiffness: 320,
                    delay: Math.min(index * 0.02, 0.15),
                  }}
                  whileTap={{ scale: 0.993 }}
                  className={cn(
                    "group relative p-4 sm:p-4.5 flex items-center justify-between transition-all select-none cursor-default",
                    isCurrent
                      ? "bg-[#166534]/10 border-l-[5px] border-l-[#166534]"
                      : "hover:bg-surface-elevated/70 active:bg-surface-elevated/90"
                  )}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {/* Rank Badge with subtle medal sheen */}
                    <div className="w-8 h-8 rounded-xl bg-surface-elevated/80 border border-border/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <span className="font-mono font-black text-xs text-ink-muted">
                        {item.value > 0 ? `#${item.rank}` : "—"}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-ink tracking-tight truncate">
                          {item.userName}
                        </span>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#166534] text-white tracking-tight shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>You</span>
                          </span>
                        ) : null}
                      </div>

                      {item.byline && (
                        <span className="text-[11px] text-ink-muted font-mono tracking-tight truncate block mt-0.5">
                          {item.byline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="font-mono font-black text-xs sm:text-sm text-[#166534] tabular-nums tracking-tight block">
                      {formatCurrency(item.value)}
                    </span>
                    <span className="text-[10px] text-ink-muted/80 font-mono tracking-tight flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 inline" />
                      <span>Direct PayPal Payout</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Apple-style Fluid Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-1 text-xs text-ink-muted">
            <span className="font-mono text-[11px] text-ink-muted/80">
              Showing page {currentPage} of {totalPages} ({rankings.length} community givers)
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-border/80 bg-surface/80 backdrop-blur-md hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1 font-mono text-[11px]"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-ink" />
                <span>Prev</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-border/80 bg-surface/80 backdrop-blur-md hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1 font-mono text-[11px]"
                aria-label="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 text-ink" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

LeaderboardRankings.displayName = "LeaderboardRankings";
