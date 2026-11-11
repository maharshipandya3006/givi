"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SwipeDeck } from "./components/swipe-deck";
import { Cause, CauseCategory } from "@/lib/types";
import { SEED_CAUSES } from "@/lib/seed-data";
import {
  Wallet,
  Zap,
  Loader2,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Sparkles,
  Compass,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import { AuthGate } from "@/components/ui/auth-gate";
import { isLocationMatch } from "@/lib/location-matcher";
import { motion } from "framer-motion";

function FeedContent() {
  const { donorPrefs, updateDonorPrefs, userId } = useUser();
  const searchParams = useSearchParams();
  const urlCauseId = searchParams.get("causeId");
  const urlCategory = searchParams.get("category") as CauseCategory | null;

  const [selectedCategory, setSelectedCategory] = useState<CauseCategory | "all">("all");
  const [allCauses, setAllCauses] = useState<Cause[]>(() => [...SEED_CAUSES]);
  const [isLoading, setIsLoading] = useState(false);

  const walletBalance = donorPrefs.walletBalance;

  const categories: { id: CauseCategory | "all"; label: string }[] = [
    { id: "all", label: "All needs" },
    { id: "utilities", label: "Heat & utilities" },
    { id: "medical", label: "Prescriptions" },
    { id: "education", label: "School & Youth" },
    { id: "food", label: "Groceries" },
    { id: "climate", label: "Emergency supplies" },
    { id: "community", label: "Family care" },
  ];

  useEffect(() => {
    async function fetchCauses() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/causes?status=active");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAllCauses(data);
          } else {
            setAllCauses(SEED_CAUSES.map((s) => ({ ...s, raisedAmount: 0.0, status: "active" as const })));
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote causes:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCauses();
  }, []);

  // When all causes are fulfilled, auto-replenish so swipe feed always has fresh cards ready
  useEffect(() => {
    const activeRemaining = allCauses.filter(
      (c) => c.status !== "funded" && Math.round((c.goalAmount - c.raisedAmount) * 100) / 100 > 0.01
    );
    if (activeRemaining.length === 0 && SEED_CAUSES.length > 0) {
      setAllCauses(SEED_CAUSES.map((s) => ({ ...s, raisedAmount: 0.0, status: "active" as const })));
    }
  }, [allCauses]);

  // Sync category or cause from query params if passed (e.g. from Explore page)
  useEffect(() => {
    if (urlCategory && categories.some((c) => c.id === urlCategory)) {
      setSelectedCategory(urlCategory);
    } else if (urlCauseId && allCauses.length > 0) {
      const target = allCauses.find((c) => c.id === urlCauseId);
      if (target && selectedCategory !== "all" && target.category !== selectedCategory) {
        setSelectedCategory(target.category);
      }
    }
  }, [urlCategory, urlCauseId, allCauses]);

  const userLoc = (donorPrefs.location || "").trim();
  const impactRadius = donorPrefs.impactRadius || "urgent";

  const visibleCauses = useMemo(() => {
    const activeUnfunded = allCauses.filter((c) => {
      const remaining = Math.round((c.goalAmount - c.raisedAmount) * 100) / 100;
      return c.status !== "funded" && remaining > 0.01;
    });

    const filtered =
      selectedCategory === "all"
        ? activeUnfunded
        : activeUnfunded.filter(
            (c) => c.category === selectedCategory || (urlCauseId && c.id === urlCauseId)
          );

    const sorted = [...filtered].sort((a, b) => {
      if (urlCauseId) {
        if (a.id === urlCauseId && b.id !== urlCauseId) return -1;
        if (b.id === urlCauseId && a.id !== urlCauseId) return 1;
      }

      if (impactRadius === "local" && userLoc) {
        const aLocal = isLocationMatch(a.receiverLocation, userLoc);
        const bLocal = isLocationMatch(b.receiverLocation, userLoc);
        if (aLocal && !bLocal) return -1;
        if (!aLocal && bLocal) return 1;
      }

      if (impactRadius === "urgent") {
        const aUrgent = a.needType === "bill" ? 2 : 1;
        const bUrgent = b.needType === "bill" ? 2 : 1;
        if (aUrgent !== bUrgent) return bUrgent - aUrgent;
      }

      if (selectedCategory === "all" && donorPrefs.interests && donorPrefs.interests.length > 0) {
        const aFav = donorPrefs.interests.includes(a.category);
        const bFav = donorPrefs.interests.includes(b.category);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
      }

      return 0;
    });

    return [...sorted].reverse();
  }, [allCauses, selectedCategory, impactRadius, userLoc, donorPrefs.interests, urlCauseId]);

  return (
    <AuthGate
      title="Sign in to swipe relief"
      description="Connect your Clerk account to swipe $5 direct micro-relief and pay overdue bills with zero platform fee."
    >
      <div className="relative flex-1 flex flex-col items-center justify-start px-3 sm:px-4 pt-2 pb-24 md:pb-16 max-w-3xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink overflow-visible">
        {/* Ambient Apple-style Depth Aura in the background */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* 1. HUD Floating Glass Capsules (Allowance & Routing) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3.5 z-10">
          <motion.div
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-2xl bg-surface border border-border shadow-xs"
          >
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:text-[#166534] transition-colors group"
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Wallet className="w-3 h-3 text-[#166534]" />
              </div>
              <span className="text-[11px] text-ink-muted font-medium font-mono">
                Allowance:
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-ink tabular-nums">
                {formatCurrency(walletBalance)}
              </span>
              <PlusCircle className="w-3.5 h-3.5 text-[#166534] opacity-80 group-hover:opacity-100 ml-0.5" />
            </Link>
          </motion.div>

          {/* Live Routing Status Capsule */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface border border-border text-xs font-mono text-ink-muted shadow-xs">
            {impactRadius === "local" ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-[#166534]" />
                <span>
                  Routing: <strong className="text-ink font-sans font-bold">Local Neighbors</strong> {userLoc ? `(${userLoc})` : ""}
                </span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Routing: <strong className="text-ink font-sans font-bold">Most Urgent First</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 2. Apple Segmented Floating Filter Rail */}
        <div className="w-full max-w-xl flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none px-2 z-10">
          <div className="inline-flex items-center p-1 rounded-2xl bg-surface border border-border shadow-xs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 select-none ${
                    isSelected ? "text-white" : "text-ink-muted hover:text-ink active:scale-95"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeFeedCategoryPill"
                      transition={{ type: "spring", damping: 24, stiffness: 320 }}
                      className="absolute inset-0 bg-[#166534] rounded-xl shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Hero Card Arena (Larger Dimensions & Depth) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[640px] max-w-lg z-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-ink-muted gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#166534]" />
              <span className="text-xs font-mono">Loading verified community causes...</span>
            </div>
          ) : visibleCauses.length === 0 ? (
            <div className="w-full max-w-md p-8 sm:p-10 rounded-[36px] bg-surface border border-border text-center flex flex-col items-center shadow-card animate-in fade-in zoom-in-95 duration-200">
              <div className="w-18 h-18 rounded-3xl bg-[#166534]/15 border border-[#166534]/30 text-[#166534] flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-black text-2xl text-ink tracking-tight mb-2">
                All Needs Cleared! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-6 font-sans">
                {selectedCategory === "all"
                  ? "Every community request in the network has been 100% funded! You and fellow givers have resolved all urgent utility and prescription bills."
                  : "All urgent needs in this category are fully funded! Check other categories or explore to keep giving."}
              </p>

              <div className="w-full flex flex-col gap-2.5">
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="w-full py-3 px-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Switch to All Needs</span>
                  </button>
                )}
                <Link
                  href="/explore"
                  className="w-full py-3 px-4 rounded-2xl bg-surface-elevated/90 hover:bg-surface-elevated border border-border text-ink font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Explore All Causes</span>
                </Link>
                <Link
                  href="/transparency"
                  className="w-full py-2.5 px-4 rounded-2xl text-ink-muted hover:text-ink text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>View Live Impact Ledger</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <SwipeDeck
              causes={visibleCauses}
              walletBalance={walletBalance}
              swipeAmount={donorPrefs.defaultSwipeAmount || 5.0}
              donorId={userId}
              donorName={
                donorPrefs.isAnonymous
                  ? "Kind Supporter (Anonymous)"
                  : donorPrefs.displayName
              }
              donorLocation={donorPrefs.location}
              onCauseSwiped={(causeId) => {
                setAllCauses((prev) => prev.filter((c) => c.id !== causeId));
              }}
              onDeductBalance={async (amt, isFunded, stats, isRollback) => {
                const hasAuthoritativeWallet = typeof stats?.walletBalance === "number";
                const next = hasAuthoritativeWallet
                  ? Math.max(0, Math.round(stats!.walletBalance! * 100) / 100)
                  : isRollback
                  ? Math.round((walletBalance + Math.abs(amt)) * 100) / 100
                  : amt !== 0
                  ? Math.max(0, Math.round((walletBalance - amt) * 100) / 100)
                  : walletBalance;
                await updateDonorPrefs({
                  ...(amt !== 0 || hasAuthoritativeWallet ? { walletBalance: next } : {}),
                  ...(isRollback
                    ? {}
                    : {
                        totalDonated:
                          stats?.totalDonated ??
                          Math.round((donorPrefs.totalDonated + amt) * 100) / 100,
                        billsCleared:
                          stats?.billsCleared ??
                          (isFunded
                            ? donorPrefs.billsCleared + 1
                            : donorPrefs.billsCleared),
                        streakDays:
                          stats?.streakDays ??
                          Math.max(1, donorPrefs.streakDays || 1),
                      }),
                });
              }}
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-ink-muted gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#166534]" />
          <span className="text-xs font-mono">Loading feed...</span>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
