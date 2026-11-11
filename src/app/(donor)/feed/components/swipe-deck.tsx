"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import TinderCard from "react-tinder-card";
import { Cause, ImpactToastData } from "@/lib/types";
import { CauseCard } from "./cause-card";
import { CauseDetailsModal } from "./cause-details-modal";
import { SwipeUpConfirmation } from "./swipe-up-confirmation";
import { ImpactToast } from "./impact-toast";
import { WalletFundingModal } from "@/components/ui/wallet-funding-modal";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  X,
  Zap,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Compass,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { isLocationMatch } from "@/lib/location-matcher";

interface SwipeDeckProps {
  causes: Cause[];
  walletBalance: number;
  swipeAmount?: number;
  donorId?: string;
  donorName?: string;
  donorLocation?: string;
  onDeductBalance: (
    amount: number,
    isFunded?: boolean,
    stats?: { totalDonated?: number; billsCleared?: number; streakDays?: number; walletBalance?: number },
    isRollback?: boolean
  ) => void;
  onResetDeck?: () => void;
  onCauseSwiped?: (causeId: string, updatedCause?: Cause) => void;
}

export function SwipeDeck({
  causes: initialCauses,
  walletBalance,
  swipeAmount = 5.0,
  donorId,
  donorName,
  donorLocation,
  onDeductBalance,
  onResetDeck,
  onCauseSwiped,
}: SwipeDeckProps) {
  const [causes, setCauses] = useState<Cause[]>(() =>
    initialCauses.filter(
      (c) =>
        c.status !== "funded" &&
        Math.round((c.goalAmount - c.raisedAmount) * 100) / 100 > 0.01
    )
  );
  const [activeToast, setActiveToast] = useState<ImpactToastData | null>(null);
  const [isFullyFundedToast, setIsFullyFundedToast] = useState(false);
  const [inspectingCause, setInspectingCause] = useState<Cause | null>(null);
  const [swipeUpCause, setSwipeUpCause] = useState<Cause | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [pendingCause, setPendingCause] = useState<Cause | null>(null);
  const [pendingDonationAmount, setPendingDonationAmount] = useState<number | null>(null);
  const [refillAmount, setRefillAmount] = useState<number>(50);
  const cardRefs = useRef<Record<string, any>>({});
  const pendingDeductionsRef = useRef<number>(0);

  const swipedStorageKey = `givi_swiped_cause_ids_${donorId || "guest"}`;
  const swipedIdsRef = useRef<Set<string>>(new Set());

  // Initialize and synchronize swiped IDs from localStorage for this donor account
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(swipedStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            swipedIdsRef.current = new Set(parsed);
            setCauses((prev) => prev.filter((c) => !swipedIdsRef.current.has(c.id)));
          }
        }
      } catch {}
    }
  }, [swipedStorageKey]);

  const markSwiped = (causeId: string) => {
    swipedIdsRef.current.add(causeId);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          swipedStorageKey,
          JSON.stringify(Array.from(swipedIdsRef.current))
        );
      } catch {}
    }
  };

  // Synchronize when initialCauses change (e.g. category switch or initial load),
  // strictly excluding any causes already swiped or fully funded.
  useEffect(() => {
    setCauses(
      initialCauses.filter(
        (c) =>
          !swipedIdsRef.current.has(c.id) &&
          c.status !== "funded" &&
          Math.round((c.goalAmount - c.raisedAmount) * 100) / 100 > 0.01
      )
    );
  }, [initialCauses]);

  // Current top card
  const currentIndex = causes.length - 1;
  const currentCause = useMemo(() => {
    return currentIndex >= 0 ? causes[currentIndex] : null;
  }, [causes, currentIndex]);

  // Virtual stack windowing: Keep only the top 15 cards in the DOM for buttery 60fps gesture rendering
  const WINDOW_SIZE = 15;
  const windowedCauses = useMemo(() => {
    return causes.slice(Math.max(0, causes.length - WINDOW_SIZE));
  }, [causes]);

  // Eagerly preload upcoming card images in browser memory cache so swipe rendering is instant
  useEffect(() => {
    if (typeof window === "undefined" || !causes || causes.length === 0) return;
    const upcoming = causes.slice(Math.max(0, causes.length - 8));
    for (const cause of upcoming) {
      const url =
        cause.channel3Product?.imageUrl ||
        cause.redactedProofUrl ||
        cause.evidenceUrls?.[0];
      if (url && typeof url === "string" && !url.includes(".pdf")) {
        const img = new Image();
        img.src = url;
      }
    }
  }, [causes]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#166534", "#22c55e", "#10b981", "#34d399"],
      });
    } catch {}
  };

  const removeCause = (causeId: string) => {
    setCauses((prev) => prev.filter((c) => c.id !== causeId));
  };

  const handleCardLeftScreen = (causeId: string) => {
    removeCause(causeId);
  };

  const handleSwipe = async (direction: string, cause: Cause) => {
    if (direction === "left") {
      // Skipped: record swiped ID and evict immediately
      markSwiped(cause.id);
      removeCause(cause.id);
      onCauseSwiped?.(cause.id);
    } else if (direction === "right") {
      // Micro-donation (or auto-capped to exact remaining goal)
      const effectiveSwipeAmount = swipeAmount || 5.0;
      const remaining = Math.max(0, Math.round((cause.goalAmount - cause.raisedAmount) * 100) / 100);

      // Guard: If cause already reached its full goal or is funded, evict immediately without deducting
      if (remaining <= 0.01 || cause.status === "funded") {
        markSwiped(cause.id);
        removeCause(cause.id);
        onCauseSwiped?.(cause.id);
        return;
      }

      const donationAmt = Math.min(effectiveSwipeAmount, remaining);
      const effectiveAvailable = Math.max(0, Math.round((walletBalance - pendingDeductionsRef.current) * 100) / 100);

      if (effectiveAvailable < donationAmt) {
        setPendingCause(cause);
        setPendingDonationAmount(donationAmt);
        setRefillAmount(Math.max(1, Math.ceil(donationAmt - effectiveAvailable)));
        setIsRefillModalOpen(true);
        cardRefs.current[cause.id]?.restoreCard?.();
        return;
      }

      // Mark cause as swiped immediately and remove from active deck
      markSwiped(cause.id);
      removeCause(cause.id);
      onCauseSwiped?.(cause.id);

      pendingDeductionsRef.current = Math.round((pendingDeductionsRef.current + donationAmt) * 100) / 100;

      // ⚡ Optimistic UI: Immediately trigger celebration & update stats
      triggerConfetti();
      const isFunded = remaining <= donationAmt;
      onDeductBalance(donationAmt, isFunded);

      // Background payout execution (no blocking or lag)
      executeDonation(cause, donationAmt, true);
    } else if (direction === "up") {
      // Pay in Full -> Open 1-tap confirmation drawer without auto-deleting card
      setSwipeUpCause(cause);
    }
  };

  const executeDonation = async (
    cause: Cause,
    amount: number,
    isOptimistic = false,
    overrideWalletBalance?: number
  ) => {
    if (!isOptimistic) setIsProcessing(true);
    try {
      const response = await fetch("/api/paypal/capture-and-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          causeId: cause.id,
          amount,
          useDemoWallet: true,
          walletBalance: overrideWalletBalance ?? walletBalance,
          donorId: donorId || "guest-session",
          donorName: donorName || "Kind Supporter",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const isFunded = data.updatedCause?.status === "funded";
        setIsFullyFundedToast(isFunded);
        const payoutBatchId = data.donation?.paypalPayoutBatchId;
        setActiveToast({
          id: data.donation.id,
          message: data.impactToast,
          amount,
          causeTitle: cause.title,
          category: cause.category,
          paypalPayoutBatchId: payoutBatchId,
          receiverEmail: cause.receiverEmail,
        });

        // Mirror transaction in client localStorage so Ledger renders it instantly
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("givi_recent_transactions");
            const existing = raw ? JSON.parse(raw) : [];
            const newRecord = {
              id: data.donation.id,
              timestamp: new Date().toISOString(),
              causeId: cause.id,
              causeTitle: cause.title,
              category: cause.category,
              donorName: donorName || "Kind Supporter",
              donorId: donorId || "guest-session",
              amount,
              paypalPayoutBatchId: payoutBatchId || `BATCH-${data.donation.id.slice(0, 8)}`,
              receiverLocation: cause.receiverLocation || "United States",
              receiverEmail: cause.receiverEmail || "givibeneficiary@business.example.com",
              receiverName: cause.receiverName || "Verified Beneficiary",
              trustScore: cause.trustScore?.overall || 95,
              isAgentic: false,
            };
            const updated = [newRecord, ...existing.filter((x: any) => x.id !== newRecord.id)].slice(0, 500);
            localStorage.setItem("givi_recent_transactions", JSON.stringify(updated));
          } catch {}
        }

        if (data.updatedDonorStats || typeof data.walletBalance === "number") {
          onDeductBalance(isOptimistic ? 0 : amount, isFunded, {
            ...(data.updatedDonorStats || {}),
            ...(typeof data.walletBalance === "number" ? { walletBalance: data.walletBalance } : {}),
          });
        } else if (!isOptimistic) {
          triggerConfetti();
          onDeductBalance(amount, isFunded);
        }

        if (data.updatedCause) {
          onCauseSwiped?.(cause.id, data.updatedCause);
        }
        removeCause(cause.id);
      } else {
        const isAlreadyFundedError =
          data?.error &&
          (data.error.includes("already reached its full funding goal") ||
            data.error.includes("already funded") ||
            data.error.includes("not found"));

        if (isAlreadyFundedError) {
          // Cause has already reached its goal: refund money and permanently evict
          if (isOptimistic) {
            onDeductBalance(-amount, false, undefined, true);
          }
          markSwiped(cause.id);
          removeCause(cause.id);
          onCauseSwiped?.(cause.id);
        } else if (data?.error && data.error.includes("Insufficient Giving Allowance")) {
          // Low balance: rollback and open funding modal
          if (isOptimistic) {
            setCauses((prev) => [cause, ...prev]);
            onDeductBalance(-amount, false, undefined, true);
          }
          setPendingCause(cause);
          setPendingDonationAmount(amount);
          setRefillAmount(Math.max(1, Math.ceil(amount - walletBalance)));
          setIsRefillModalOpen(true);
          cardRefs.current[cause.id]?.restoreCard?.();
        } else {
          // General error: rollback optimistic state
          if (isOptimistic) {
            setCauses((prev) => [cause, ...prev]);
            onDeductBalance(-amount, false, undefined, true);
          }
          alert(data?.error || "Failed to process micro-donation.");
        }
      }
    } catch (err) {
      console.error("Donation execution failed:", err);
      if (isOptimistic) {
        setCauses((prev) => [cause, ...prev]);
        onDeductBalance(-amount, false, undefined, true);
      }
      alert("Network error processing donation. Please try again.");
    } finally {
      pendingDeductionsRef.current = Math.max(0, Math.round((pendingDeductionsRef.current - amount) * 100) / 100);
      if (!isOptimistic) setIsProcessing(false);
    }
  };

  const handleManualAction = (action: "left" | "right" | "up") => {
    if (!currentCause || isProcessing) return;
    if (action === "left") {
      cardRefs.current[currentCause.id]?.swipe?.("left");
    } else if (action === "right") {
      cardRefs.current[currentCause.id]?.swipe?.("right");
    } else if (action === "up") {
      setSwipeUpCause(currentCause);
    }
  };

  // Keyboard shortcut listener for arrow keys & spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        inspectingCause ||
        swipeUpCause
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleManualAction("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleManualAction("right");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleManualAction("up");
      } else if (e.key === " " && currentCause) {
        e.preventDefault();
        setInspectingCause(currentCause);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCause, inspectingCause, swipeUpCause, isProcessing]);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Active Celebratory Impact Toast */}
      {activeToast && (
        <ImpactToast
          toast={activeToast}
          isFullyFunded={isFullyFundedToast}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Expanded Dimensional Card Arena Deck Container */}
      <div className="relative w-full max-w-[460px] h-[640px] flex justify-center items-center">
        {windowedCauses.length > 0 ? (
          windowedCauses.map((cause, index) => {
            const isTop = index === windowedCauses.length - 1;
            const isSecond = index === windowedCauses.length - 2;

            return (
              <TinderCard
                key={cause.id}
                ref={(el: any) => {
                  if (el) cardRefs.current[cause.id] = el;
                }}
                onSwipe={(dir) => handleSwipe(dir, cause)}
                onCardLeftScreen={() => handleCardLeftScreen(cause.id)}
                preventSwipe={["down"]}
                swipeRequirementType="position"
                swipeThreshold={75}
                className={`absolute inset-0 flex justify-center items-center select-none ${
                  isTop
                    ? "z-30 cursor-grab active:cursor-grabbing"
                    : isSecond
                    ? "z-20 scale-[0.96] translate-y-3 pointer-events-none"
                    : "hidden pointer-events-none"
                }`}
              >
                <CauseCard
                  cause={cause}
                  isLocalNeighbor={isLocationMatch(cause.receiverLocation, donorLocation || "")}
                  onInspect={(c) => setInspectingCause(c)}
                  onAction={handleManualAction}
                />
              </TinderCard>
            );
          })
        ) : (
          /* Empty Deck State */
          <div className="w-full h-full rounded-[36px] bg-surface border border-border flex flex-col items-center justify-center p-8 text-center shadow-card animate-in fade-in zoom-in-95 duration-200">
            <div className="w-18 h-18 rounded-3xl bg-[#166534]/15 border border-[#166534]/30 text-[#166534] flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-black text-ink tracking-tight mb-2">
              All Needs Cleared! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted max-w-xs mb-6 leading-relaxed font-sans">
              Every verified cause in this category has been reviewed or fully funded. Your direct micro-relief makes an immediate difference.
            </p>

            <div className="w-full max-w-xs flex flex-col gap-2.5">
              <button
                onClick={() => {
                  swipedIdsRef.current.clear();
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.removeItem(swipedStorageKey);
                    } catch {}
                  }
                  if (onResetDeck) {
                    onResetDeck();
                  } else {
                    const activeOnly = initialCauses.filter(
                      (c) => c.status !== "funded" && (c.goalAmount - c.raisedAmount) > 0.01
                    );
                    setCauses(activeOnly.length > 0 ? activeOnly : initialCauses);
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Fresh Causes</span>
              </button>
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
        )}
      </div>

      {/* Floating Apple-Style Monolith Action Controls with Physical Springs */}
      {currentCause && (
        <div className="w-full flex items-center justify-center gap-6 sm:gap-8 mt-5 sm:mt-6 px-2">
          {/* 🔴 Left: Skip (Swipe Left) */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", damping: 20, stiffness: 350 }}
            onClick={() => handleManualAction("left")}
            disabled={isProcessing}
            className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-surface/90 hover:bg-surface text-stone-500 hover:text-rose-500 border border-border/80 flex items-center justify-center shadow-lg backdrop-blur-md disabled:opacity-50 group focus-visible:outline-none"
            title="Pass to next cause (Swipe Left)"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-200" />
          </motion.button>

          {/* ⚡ Center: Superswipe (Pay in Full / Swipe Up) */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", damping: 20, stiffness: 350 }}
            onClick={() => handleManualAction("up")}
            disabled={isProcessing}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-amber-500 text-stone-900 flex flex-col items-center justify-center shadow-amber-md border-2 border-white/60 disabled:opacity-50 group focus-visible:outline-none"
            title="Super Swipe · Pay off remaining balance in full (Swipe Up)"
          >
            <Zap className="w-8 h-8 sm:w-9 sm:h-9 fill-stone-900 text-stone-900 drop-shadow-sm group-hover:scale-110 transition-transform duration-200" />
            <span className="text-[10px] font-black tracking-wider uppercase leading-none mt-0.5">
              Super
            </span>
          </motion.button>

          {/* 🟢 Right: Swipe Right Feature (Micro-Donation) */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", damping: 20, stiffness: 350 }}
            onClick={() => handleManualAction("right")}
            disabled={isProcessing}
            className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#166534] to-emerald-500 hover:from-[#14532d] hover:to-emerald-600 text-white flex flex-col items-center justify-center shadow-emerald-md border-2 border-emerald-300/40 disabled:opacity-50 focus-visible:outline-none"
            title={`Chip in $${swipeAmount} micro-donation via instant PayPal Payout (Swipe Right)`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white drop-shadow-sm" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-tight leading-none mt-0.5 font-mono">
                  {swipeAmount % 1 === 0 ? `$${swipeAmount}` : `$${swipeAmount.toFixed(2)}`}
                </span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Inspect Document Modal */}
      {inspectingCause && (
        <CauseDetailsModal
          cause={inspectingCause}
          onClose={() => setInspectingCause(null)}
          onDonate={(amt) => {
            const cause = inspectingCause;
            setInspectingCause(null);
            executeDonation(cause, amt);
          }}
        />
      )}

      {/* Swipe Up Pay-In-Full 1-Tap Drawer */}
      <SwipeUpConfirmation
        cause={swipeUpCause}
        isOpen={Boolean(swipeUpCause)}
        walletBalance={walletBalance}
        onClose={() => {
          const causeId = swipeUpCause?.id;
          setSwipeUpCause(null);
          if (causeId) {
            cardRefs.current[causeId]?.restoreCard?.();
          }
        }}
        onConfirm={(cause, amt) => {
          const causeId = cause.id;
          setSwipeUpCause(null);
          const effectiveAvailable = Math.max(0, Math.round((walletBalance - pendingDeductionsRef.current) * 100) / 100);
          if (effectiveAvailable < amt) {
            cardRefs.current[causeId]?.restoreCard?.();
            setPendingCause(cause);
            setPendingDonationAmount(amt);
            setRefillAmount(Math.max(1, Math.ceil(amt - effectiveAvailable)));
            setIsRefillModalOpen(true);
            return;
          }
          pendingDeductionsRef.current = Math.round((pendingDeductionsRef.current + amt) * 100) / 100;
          markSwiped(cause.id);
          setCauses((prev) => prev.filter((c) => c.id !== cause.id));
          onCauseSwiped?.(cause.id);
          triggerConfetti();
          onDeductBalance(amt, true);
          executeDonation(cause, amt, true);
        }}
      />

      {/* Low Balance Refill Modal */}
      <WalletFundingModal
        isOpen={isRefillModalOpen}
        onClose={() => {
          setIsRefillModalOpen(false);
          setPendingCause(null);
          setPendingDonationAmount(null);
        }}
        initialAmount={refillAmount}
        title="Giving Allowance Depleted"
        description="Your Giving Allowance is low. Add funds via PayPal Sandbox to continue swiping instantly."
        onSuccess={(_amount, newBalance) => {
          if (pendingCause) {
            const causeToDonate = pendingCause;
            const amtToDonate = pendingDonationAmount || swipeAmount || 5.0;
            const remainingAfterDonate = Math.max(0, Math.round((newBalance - amtToDonate) * 100) / 100);
            setPendingCause(null);
            setPendingDonationAmount(null);
            setIsRefillModalOpen(false);
            markSwiped(causeToDonate.id);
            setCauses((prev) => prev.filter((c) => c.id !== causeToDonate.id));
            onCauseSwiped?.(causeToDonate.id);
            triggerConfetti();
            onDeductBalance(amtToDonate, false, { walletBalance: remainingAfterDonate });
            executeDonation(causeToDonate, amtToDonate, true, newBalance);
          }
        }}
      />
    </div>
  );
}
