"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash2, Scissors, MousePointer, Sparkles } from "lucide-react";

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
        className="relative px-6 py-1.5 flex items-center justify-center bg-[#118C4F]/85 backdrop-blur-md border-y border-[#1cb668]/50 text-black font-black tracking-widest text-xs uppercase"
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

/**
 * DrawnTape
 * Interface for interactive tapes dynamically placed by the user.
 */
export interface DrawnTapeItem {
  id: string;
  startX: number;
  startY: number;
  length: number;
  angle: number;
  label: string;
}

/**
 * DollarTapeCanvas
 * Full interactive Huggo Tape canvas that allows users to click & drag anywhere
 * on the hero section to tape real physical emerald dollar ribbons across the screen.
 * Tapes can be peeled off or cleared with a tactile HUD dispenser.
 */
export function DollarTapeCanvas({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [tapes, setTapes] = useState<DrawnTapeItem[]>([]);
  const [currentDrag, setCurrentDrag] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentDrag({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!currentDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentDrag((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
  };

  const handlePointerUp = () => {
    if (!currentDrag) return;
    const dx = currentDrag.currentX - currentDrag.startX;
    const dy = currentDrag.currentY - currentDrag.startY;
    const length = Math.hypot(dx, dy);

    // Only commit if dragged more than 35px
    if (length > 35) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const count = Math.max(3, Math.floor(length / 22));
      const label = "$ ".repeat(count).trim();

      const newTape: DrawnTapeItem = {
        id: `tape-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        startX: currentDrag.startX,
        startY: currentDrag.startY,
        length,
        angle,
        label,
      };

      setTapes((prev) => [...prev, newTape]);
    }

    setCurrentDrag(null);
  };

  const removeTape = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTapes((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllTapes = () => {
    setTapes([]);
  };

  // Drag preview calculations
  const dragLength = currentDrag
    ? Math.hypot(
        currentDrag.currentX - currentDrag.startX,
        currentDrag.currentY - currentDrag.startY
      )
    : 0;
  const dragAngle = currentDrag
    ? (Math.atan2(
        currentDrag.currentY - currentDrag.startY,
        currentDrag.currentX - currentDrag.startX
      ) *
        180) /
      Math.PI
    : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full select-none", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        cursor: isDrawingMode ? "crosshair" : "default",
      }}
    >
      {/* Underlying Content */}
      <div className="relative z-10">{children}</div>

      {/* Interactive Drawn Tapes Layer */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {tapes.map((tape) => (
            <motion.div
              key={tape.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0, y: -20, rotate: tape.angle + 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute pointer-events-auto cursor-pointer select-none group"
              style={{
                left: tape.startX,
                top: tape.startY,
                width: tape.length,
                transform: `rotate(${tape.angle}deg)`,
                transformOrigin: "0% 50%",
              }}
              onClick={(e) => removeTape(tape.id, e)}
              title="Click to peel and discard this tape"
            >
              <div
                className="relative py-1.5 px-3 flex items-center justify-center bg-[#118C4F]/90 backdrop-blur-md border-y border-[#1cb668]/70 shadow-lg text-black font-mono font-black text-xs transition-transform group-hover:scale-[1.02] group-hover:brightness-110"
                style={{
                  clipPath:
                    "polygon(0% 4px, 4px 0%, 8px 4px, 12px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, calc(100% - 8px) calc(100% - 4px), 0% 100%)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/25 pointer-events-none" />
                <span className="tracking-[0.2em] text-[10px] text-zinc-950 font-extrabold whitespace-nowrap overflow-hidden">
                  {tape.label}
                </span>
                <span className="ml-2 text-[8px] font-sans font-bold bg-black/40 text-white px-1 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  PEEL
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Live Dragging Tape Preview */}
        {currentDrag && dragLength > 15 && (
          <div
            className="absolute pointer-events-none select-none"
            style={{
              left: currentDrag.startX,
              top: currentDrag.startY,
              width: dragLength,
              transform: `rotate(${dragAngle}deg)`,
              transformOrigin: "0% 50%",
            }}
          >
            <div
              className="relative py-1.5 px-3 flex items-center justify-center bg-[#118C4F]/75 backdrop-blur-sm border-y border-[#1cb668] shadow-md text-black font-mono font-black text-xs"
              style={{
                clipPath:
                  "polygon(0% 4px, 4px 0%, 8px 4px, 12px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, calc(100% - 8px) calc(100% - 4px), 0% 100%)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20" />
              <span className="tracking-[0.2em] text-[10px] text-zinc-950 font-extrabold whitespace-nowrap overflow-hidden">
                {"$ ".repeat(Math.max(2, Math.floor(dragLength / 22)))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Tape Dispenser HUD (21st.dev Huggo Tape Controller) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950/90 border border-[#1f1f23] shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
            isDrawingMode
              ? "bg-[#118C4F] text-white shadow-md shadow-[#118C4F]/30"
              : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-[#1f1f23]"
          )}
        >
          {isDrawingMode ? (
            <Scissors className="w-3.5 h-3.5 text-white" />
          ) : (
            <MousePointer className="w-3.5 h-3.5 text-[#118C4F]" />
          )}
          <span>{isDrawingMode ? "Tape Mode: Active" : "Draw Dollar Tape"}</span>
        </button>

        {tapes.length > 0 && (
          <button
            type="button"
            onClick={clearAllTapes}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-[#1f1f23] transition-colors"
            title="Clear all drawn tapes"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Clear ({tapes.length})</span>
          </button>
        )}

        {isDrawingMode && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400 px-2">
            <Sparkles className="w-3 h-3 text-[#118C4F]" />
            <span>Drag anywhere to tape</span>
          </div>
        )}
      </div>
    </div>
  );
}
