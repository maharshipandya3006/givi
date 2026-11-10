"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ArrowUp } from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SwipeUpConfirmationProps {
  cause: Cause | null;
  isOpen: boolean;
  walletBalance?: number;
  onClose: () => void;
  onConfirm: (cause: Cause, amount: number) => void;
}

export function SwipeUpConfirmation({
  cause,
  isOpen,
  walletBalance,
  onClose,
  onConfirm,
}: SwipeUpConfirmationProps) {
  if (!cause) return null;

  const remaining = Math.max(0.01, Math.round((cause.goalAmount - cause.raisedAmount) * 100) / 100);
  const hasInsufficientFunds = typeof walletBalance === "number" && walletBalance < remaining;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Bottom Confirmation Drawer */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[100] max-w-md mx-auto w-full bg-surface border-t border-border rounded-t-3xl p-6 text-ink shadow-2xl"
          >
            {/* Grab Bar */}
            <div className="w-12 h-1.5 rounded-full bg-border mx-auto mb-5" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Clear entire overdue bill
                  </h3>
                  <span className="text-xs text-ink-muted">
                    Instant 1-tap swipe confirmation
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border mb-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Beneficiary:</span>
                <span className="font-bold text-ink">
                  {cause.receiverName} ({cause.receiverLocation})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Statement:</span>
                <span className="font-medium text-ink-dim line-clamp-1 max-w-[200px]">
                  {cause.title}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Platform fee:</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  $0.00 (0% take rate)
                </span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex items-baseline justify-between">
                <span className="text-xs font-bold text-ink-dim">
                  Total instant payout:
                </span>
                <span className="text-2xl font-black text-emerald-400 tabular-nums">
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-muted text-center mb-5 leading-relaxed">
              100% of this payment will disburse directly to {cause.receiverName}&apos;s PayPal account in &lt; 2 seconds.
            </p>

            {hasInsufficientFunds && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between mb-4">
                <span>Allowance: {formatCurrency(walletBalance || 0)}</span>
                <span className="font-semibold">Short by {formatCurrency(remaining - (walletBalance || 0))}</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => onConfirm(cause, remaining)}
                className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-emerald-md transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  hasInsufficientFunds
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {hasInsufficientFunds
                    ? `Add ${formatCurrency(remaining - (walletBalance || 0))} & Clear Bill`
                    : `Confirm & disburse ${formatCurrency(remaining)}`}
                </span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Cancel & return to deck
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
