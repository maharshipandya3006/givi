"use client";

import { useState, useMemo } from "react";
import TinderCard from "react-tinder-card";
import { Cause, ImpactToastData } from "@/lib/types";
import { CauseCard } from "./cause-card";
import { CauseDetailsModal } from "./cause-details-modal";
import { SwipeUpConfirmation } from "./swipe-up-confirmation";
import { ImpactToast } from "./impact-toast";
import { Heart, X, Zap, RefreshCw, CheckCircle2 } from "lucide-react";

interface SwipeDeckProps {
  initialCauses: Cause[];
  onDonationComplete?: (newBalance: number) => void;
}

export function SwipeDeck({ initialCauses, onDonationComplete }: SwipeDeckProps) {
  const [causes, setCauses] = useState<Cause[]>(initialCauses);
  const [activeToast, setActiveToast] = useState<ImpactToastData | null>(null);
  const [isFullyFundedToast, setIsFullyFundedToast] = useState(false);
  const [inspectingCause, setInspectingCause] = useState<Cause | null>(null);
  const [swipeUpCause, setSwipeUpCause] = useState<Cause | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Top card index
  const currentIndex = causes.length - 1;

  const currentCause = useMemo(() => {
    return currentIndex >= 0 ? causes[currentIndex] : null;
  }, [causes, currentIndex]);

  const handleSwipe = async (direction: string, cause: Cause) => {
    if (direction === "left") {
      // Skipped
      setCauses((prev) => prev.filter((c) => c.id !== cause.id));
    } else if (direction === "right") {
      // Micro-donation $5 (or auto-capped remaining)
      const remaining = Math.max(0.01, cause.goalAmount - cause.raisedAmount);
      const donationAmt = Math.min(5.0, remaining);
      await executeDonation(cause, donationAmt);
    } else if (direction === "up") {
      // Pay in Full -> Open confirmation drawer
      setSwipeUpCause(cause);
    }
  };

  const executeDonation = async (cause: Cause, amount: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/paypal/capture-and-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          causeId: cause.id,
          amount,
          useDemoWallet: true,
          donorName: "Kind Supporter",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const isFunded = data.updatedCause.status === "funded";
        setIsFullyFundedToast(isFunded);
        setActiveToast({
          id: data.donation.id,
          message: data.impactToast,
          amount,
          causeTitle: cause.title,
          category: cause.category,
        });

        if (onDonationComplete && data.walletBalance !== undefined) {
          onDonationComplete(data.walletBalance);
        }

        // Pop from deck
        setCauses((prev) => prev.filter((c) => c.id !== cause.id));
      } else {
        alert(data.error || "Donation failed. Please try again.");
      }
    } catch (err) {
      console.error("Donation execution error:", err);
      alert("Network timeout. Please check your connection.");
    } finally {
      setIsProcessing(false);
      setSwipeUpCause(null);
    }
  };

  const handleManualAction = (direction: "left" | "right" | "up") => {
    if (!currentCause || isProcessing) return;
    if (direction === "up") {
      setSwipeUpCause(currentCause);
    } else {
      handleSwipe(direction, currentCause);
    }
  };

  const handleResetDeck = () => {
    setCauses(initialCauses);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto relative px-2">
      {/* Active Card Deck Stack */}
      <div className="relative w-full h-[590px] flex items-center justify-center">
        {causes.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-zinc-950 border border-[#1f1f23] shadow-2xl max-w-sm w-full flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#118C4F]/10 text-[#118C4F] border border-[#118C4F]/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">You cleared the deck</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Every verified statement in this category has been funded or reviewed. Thank you for
              driving immediate good in the world.
            </p>
            <button
              onClick={handleResetDeck}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#118C4F] hover:bg-[#0e703f] text-white font-semibold text-xs shadow-lg shadow-[#118C4F]/20 transition-all hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Cause Deck
            </button>
          </div>
        ) : (
          causes.map((cause, index) => (
            <TinderCard
              key={cause.id}
              onSwipe={(dir) => handleSwipe(dir, cause)}
              preventSwipe={["down"]}
              className="swipe-card absolute"
            >
              <div
                style={{
                  transform:
                    index === currentIndex
                      ? "none"
                      : `scale(${1 - (currentIndex - index) * 0.04}) translateY(${
                          (currentIndex - index) * 12
                        }px)`,
                  opacity: index === currentIndex ? 1 : 0.6,
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  pointerEvents: index === currentIndex ? "auto" : "none",
                }}
              >
                <CauseCard cause={cause} onInspect={(c) => setInspectingCause(c)} />
              </div>
            </TinderCard>
          ))
        )}
      </div>

      {/* Accessible Action Controls Below Deck */}
      {causes.length > 0 && (
        <div className="flex items-center justify-center gap-5 mt-6 w-full">
          {/* Skip (Left) */}
          <button
            onClick={() => handleManualAction("left")}
            disabled={isProcessing}
            className="w-14 h-14 rounded-full bg-black border border-[#1f1f23] hover:border-zinc-500 text-zinc-400 hover:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="Skip Cause"
            title="Pass (Swipe Left)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Pay Full (Up) */}
          <button
            onClick={() => handleManualAction("up")}
            disabled={isProcessing}
            className="w-12 h-12 rounded-full bg-black border border-[#118C4F]/40 hover:border-[#118C4F] text-[#118C4F] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="Clear The Ask in Full"
            title="Pay Remaining Goal (Swipe Up)"
          >
            <Zap className="w-5 h-5 fill-[#118C4F]" />
          </button>

          {/* Micro-Donate $5 (Right) */}
          <button
            onClick={() => handleManualAction("right")}
            disabled={isProcessing}
            className="w-16 h-16 rounded-full bg-[#118C4F] hover:bg-[#0e703f] text-white flex items-center justify-center shadow-xl shadow-[#118C4F]/30 transition-transform hover:scale-110 active:scale-95"
            aria-label="Donate $5"
            title="Chip in $5 (Swipe Right)"
          >
            <Heart className="w-7 h-7 fill-white" />
          </button>
        </div>
      )}

      {/* Modals & Toasts */}
      <CauseDetailsModal
        cause={inspectingCause}
        isOpen={!!inspectingCause}
        onClose={() => setInspectingCause(null)}
      />

      <SwipeUpConfirmation
        cause={swipeUpCause}
        isOpen={!!swipeUpCause}
        onClose={() => setSwipeUpCause(null)}
        onConfirm={executeDonation}
        isProcessing={isProcessing}
      />

      <ImpactToast
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
        isFullyFunded={isFullyFundedToast}
      />
    </div>
  );
}
