"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ShieldCheck } from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SwipeUpConfirmationProps {
  cause: Cause | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cause: Cause, fullAmount: number) => void;
  isProcessing: boolean;
}

export function SwipeUpConfirmation({
  cause,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: SwipeUpConfirmationProps) {
  if (!cause) return null;

  const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto p-4 sm:p-6 bg-zinc-900 border-t border-zinc-700/80 rounded-t-3xl shadow-2xl text-white"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto mb-5" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  👆
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Clear The Ask in Full</h3>
                  <p className="text-xs text-zinc-400">1-Tap Protected Confirmation</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 mb-6">
              <div className="text-xs text-zinc-400 mb-1 font-mono uppercase">
                {cause.receiverLocation} · {cause.receiverName}
              </div>
              <div className="font-semibold text-sm text-zinc-200 mb-3">{cause.title}</div>
              <div className="flex items-baseline justify-between pt-2 border-t border-zinc-700/50">
                <span className="text-xs text-zinc-400">Remaining to Fund:</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-6 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                100% of this payment dispatches directly to {cause.receiverEmail} with 0% platform fee.
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(cause, remaining)}
                disabled={isProcessing}
                className="flex-[2] py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
              >
                <Zap className="w-4 h-4 fill-white" />
                {isProcessing ? "Processing Payout..." : `Confirm & Pay ${formatCurrency(remaining)}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

