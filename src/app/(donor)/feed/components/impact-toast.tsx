"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, Sparkles, X, ExternalLink } from "lucide-react";
import { ImpactToastData } from "@/lib/types";

interface ImpactToastProps {
  toast: ImpactToastData | null;
  onDismiss?: () => void;
  onClose?: () => void;
  isFullyFunded?: boolean;
}

export function ImpactToast({
  toast,
  onDismiss,
  onClose,
  isFullyFunded,
}: ImpactToastProps) {
  const dismiss = () => {
    if (onDismiss) onDismiss();
    if (onClose) onClose();
  };

  useEffect(() => {
    if (toast) {
      if (isFullyFunded) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.8 },
          colors: ["#10b981", "#34d399", "#ecfdf5", "#f59e0b"],
        });
      }

      const timer = setTimeout(() => {
        dismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, isFullyFunded]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-surface/95 text-ink border border-emerald-500/40 shadow-card backdrop-blur-xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              {isFullyFunded ? (
                <Sparkles className="w-5 h-5 text-emerald-400" />
              ) : (
                <Heart className="w-5 h-5 fill-emerald-400 text-emerald-400" />
              )}
            </div>

            <div className="flex flex-col text-left pr-2">
              <span className="text-xs text-emerald-400 font-semibold">
                {isFullyFunded
                  ? "Bill cleared in full · Instant payout"
                  : "Instant PayPal payout sent · 100% direct"}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                {toast.message}
              </p>
              {toast.paypalPayoutBatchId && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-ink-muted">
                  <span className="truncate max-w-[140px] text-emerald-500 font-bold">
                    #{toast.paypalPayoutBatchId}
                  </span>
                  <span>·</span>
                  <Link
                    href="/transparency"
                    className="text-[#166534] dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>View in Ledger</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={dismiss}
              className="text-ink-muted hover:text-ink p-1 rounded-full transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
