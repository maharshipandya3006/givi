"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, Sparkles, X } from "lucide-react";
import { ImpactToastData } from "@/lib/types";

interface ImpactToastProps {
  toast: ImpactToastData | null;
  onDismiss: () => void;
  isFullyFunded?: boolean;
}

export function ImpactToast({ toast, onDismiss, isFullyFunded }: ImpactToastProps) {
  useEffect(() => {
    if (toast) {
      if (isFullyFunded) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#118C4F", "#0e703f", "#1cb668", "#ffffff"],
        });
      }

      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, isFullyFunded, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/95 text-white border border-[#118C4F]/40 shadow-2xl backdrop-blur-xl">
            <div className="w-8 h-8 rounded-full bg-[#118C4F]/20 text-[#118C4F] flex items-center justify-center shrink-0">
              {isFullyFunded ? (
                <Sparkles className="w-4 h-4 text-[#118C4F] animate-spin" />
              ) : (
                <Heart className="w-4 h-4 fill-[#118C4F]" />
              )}
            </div>

            <div className="flex flex-col text-left pr-2">
              <span className="text-[11px] font-mono text-[#118C4F] uppercase tracking-wider font-semibold">
                {isFullyFunded ? "Goal 100% Completed" : "Direct Payout Sent · 100% Delivered"}
              </span>
              <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
