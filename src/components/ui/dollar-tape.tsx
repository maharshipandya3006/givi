"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DollarTapeStripProps {
  className?: string;
  angle?: number;
  label?: string;
  isPeelable?: boolean;
  onPeelChange?: (peeled: boolean) => void;
}

/**
 * DollarTapeStrip
 * Tactile, translucent emerald green adhesive tape with repeating '$' currency symbols,
 * serrated/torn edge geometry, and interactive spring-loaded peel mechanics.
 */
export function DollarTapeStrip({
  className,
  angle = -6,
  label = "$ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $",
  isPeelable = true,
  onPeelChange,
}: DollarTapeStripProps) {
  const [isPeeled, setIsPeeled] = useState(false);

  const togglePeel = () => {
    if (!isPeelable) return;
    const nextState = !isPeeled;
    setIsPeeled(nextState);
    onPeelChange?.(nextState);
  };

  return (
    <motion.div
      className={cn(
        "relative select-none cursor-pointer z-20 inline-flex items-center justify-center overflow-hidden",
        className
      )}
      initial={false}
      animate={{
        rotate: isPeeled ? angle + 14 : angle,
        y: isPeeled ? -16 : 0,
        x: isPeeled ? 12 : 0,
        scale: isPeeled ? 1.05 : 1,
        boxShadow: isPeeled
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(17, 140, 79, 0.3)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(17, 140, 79, 0.2)",
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={togglePeel}
      whileHover={isPeelable ? { scale: 1.03 } : undefined}
      title={isPeelable ? "Click or tap to peel tape" : undefined}
    >
      {/* Tape Body with serrated jagged edges */}
      <div
        className="relative px-6 py-1.5 flex items-center justify-center bg-[#118C4F]/80 backdrop-blur-md border-y border-[#1cb668]/50 text-black font-black tracking-widest text-xs uppercase"
        style={{
          clipPath:
            "polygon(0% 4px, 4px 0%, 8px 4px, 12px 0%, 16px 4px, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, calc(100% - 8px) calc(100% - 4px), calc(100% - 12px) 100%, 0% 100%)",
        }}
      >
        {/* Glossy light reflection sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/25 pointer-events-none" />

        {/* Currency glyph repeat string */}
        <span className="font-mono tracking-[0.25em] text-[11px] text-zinc-950 font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] whitespace-nowrap">
          {label}
        </span>

        {/* Peel indicator hint */}
        {isPeelable && (
          <span className="ml-3 text-[9px] font-sans font-bold text-black/70 bg-white/40 px-1.5 py-0.5 rounded">
            {isPeeled ? "TAP TO STICK" : "PEEL"}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * DollarTapeCorner
 * Fixed-angle corner tape tab for anchoring bills, stats, or bento cards.
 */
export function DollarTapeCorner({
  corner = "top-left",
  className,
}: {
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const getStyles = () => {
    switch (corner) {
      case "top-left":
        return "-top-3 -left-4 -rotate-45";
      case "top-right":
        return "-top-3 -right-4 rotate-45";
      case "bottom-left":
        return "-bottom-3 -left-4 rotate-45";
      case "bottom-right":
        return "-bottom-3 -right-4 -rotate-45";
    }
  };

  return (
    <div
      className={cn(
        "absolute z-30 select-none pointer-events-none w-20 py-1 bg-[#118C4F]/85 border-y border-[#1cb668]/60 shadow-md backdrop-blur-sm flex items-center justify-center",
        getStyles(),
        className
      )}
      style={{
        clipPath:
          "polygon(0% 3px, 3px 0%, 6px 3px, 9px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, calc(100% - 6px) calc(100% - 3px), 0% 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/20" />
      <span className="font-mono text-[9px] font-black tracking-widest text-black/90">
        $$$$$
      </span>
    </div>
  );
}

/**
 * DollarTickerTape
 * Infinite animated horizontal dollar ticker banner.
 */
export function DollarTickerTape({ className }: { className?: string }) {
  const tickerItems = [
    "$100% DIRECT TO RECIPIENT",
    "$0 PLATFORM FEES",
    "$2.4s PAYPAL PAYOUT SPEED",
    "$GEMINI AI OCR VERIFIED",
    "$AG GRID AUDIT LEDGER",
    "$AUTONOMOUS GIVING AGENTS",
  ];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden py-2 bg-[#118C4F] text-black font-mono font-black text-xs select-none border-y border-[#1cb668]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
      <motion.div
        className="flex whitespace-nowrap gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 18, repeat: Infinity }}
      >
        {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
          <div key={idx} className="inline-flex items-center gap-3">
            <span className="text-zinc-950 tracking-wider">{item}</span>
            <span className="text-black/40 font-bold">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
