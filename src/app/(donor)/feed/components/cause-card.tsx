"use client";

import { useState } from "react";
import {
  ShieldCheck,
  MapPin,
  Eye,
  ShoppingCart,
  Receipt,
  ArrowUp,
  ArrowLeft,
  Heart,
  Sparkles,
} from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CauseCardProps {
  cause: Cause;
  onInspect: (cause: Cause) => void;
  onAction?: (action: "left" | "right" | "up") => void;
  isLocalNeighbor?: boolean;
}

export function CauseCard({ cause, onInspect, isLocalNeighbor = false }: CauseCardProps) {
  const [imgError, setImgError] = useState(false);
  const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);
  const percentage = Math.min(
    100,
    Math.round((cause.raisedAmount / cause.goalAmount) * 100)
  );
  const mediaUrl =
    cause.channel3Product?.imageUrl || cause.evidenceUrls[0] || cause.redactedProofUrl || "";
  const isPdfDoc =
    !cause.channel3Product?.imageUrl &&
    (mediaUrl.toLowerCase().includes(".pdf") || mediaUrl.startsWith("data:application/pdf"));

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "medical":
        return {
          pill: "bg-rose-500/10 text-rose-500 border-rose-500/25",
          accent: "from-rose-500 to-rose-600",
        };
      case "food":
        return {
          pill: "bg-amber-500/10 text-amber-600 border-amber-500/25",
          accent: "from-amber-500 to-amber-600",
        };
      case "education":
        return {
          pill: "bg-sky-500/10 text-sky-600 border-sky-500/25",
          accent: "from-sky-500 to-sky-600",
        };
      case "community":
        return {
          pill: "bg-purple-500/10 text-purple-600 border-purple-500/25",
          accent: "from-purple-500 to-purple-600",
        };
      default:
        return {
          pill: "bg-emerald-500/10 text-[#166534] border-emerald-500/25",
          accent: "from-emerald-500 to-[#166534]",
        };
    }
  };

  const theme = getCategoryTheme(cause.category);

  return (
    <div className="relative w-full h-full max-h-[640px] max-w-[460px] rounded-[36px] bg-surface border border-border shadow-[0_24px_50px_-12px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col justify-between text-ink select-none transition-all duration-300">
      {/* Specular Top Edge Light Refraction (Apple Material Lighting) */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none z-20" />

      {/* 1. Header: Verified Identity & AI OCR Trust Badge */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between border-b border-border/80 bg-surface-elevated z-10">
        <div className="flex flex-col text-left min-w-0 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base font-extrabold text-ink tracking-tight leading-tight truncate">
              {cause.receiverName}
            </span>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${theme.pill}`}
            >
              {cause.category}
            </span>
            {isLocalNeighbor && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#166534] border border-emerald-500/30 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span>Neighbor</span>
              </span>
            )}
          </div>
          <span className="text-xs text-ink-muted flex items-center gap-1 mt-0.5 font-mono">
            <MapPin className="w-3 h-3 text-[#166534] shrink-0" />
            <span className="truncate">{cause.receiverLocation}</span>
          </span>
        </div>

        {/* Gemini Trust Score Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspect(cause);
          }}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#166534] text-xs font-bold hover:bg-emerald-500/20 transition-all active:scale-95 shadow-xs"
          title="Click to view Gemini AI OCR Verification Breakdown"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
          <span>{cause.trustScore.overall}% verified</span>
        </button>
      </div>

      {/* 2. Hero Visual Statement & Physical Evidence */}
      <div className="relative flex-1 bg-surface-elevated overflow-hidden group min-h-[250px]">
        {/* Placeholder shimmer while decoding/loading */}
        <div className="absolute inset-0 bg-surface-elevated animate-pulse flex items-center justify-center text-ink-muted">
          <Receipt className="w-8 h-8 opacity-20" />
        </div>

        {isPdfDoc || imgError ? (
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-surface-elevated text-ink gap-2.5 p-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#166534]">
              <Receipt className="w-8 h-8" />
            </div>
            <span className="text-sm font-mono font-bold max-w-[260px] truncate text-center">
              {cause.title}
            </span>
            <span className="text-[11px] text-ink-muted font-mono">
              Verified Utility Bill Statement
            </span>
          </div>
        ) : (
          <img
            src={mediaUrl}
            alt={cause.title}
            loading="eager"
            decoding="async"
            onError={() => setImgError(true)}
            className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        )}

        {/* Apple Photographic Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none z-10" />

        {/* Inspect Proof Float Pill (Exclusive trigger for proof inspection) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(cause);
          }}
          className="absolute top-3.5 right-3.5 px-3.5 py-1.5 rounded-full bg-surface/95 hover:bg-surface text-ink text-xs font-bold border border-border/80 flex items-center gap-1.5 shadow-md backdrop-blur-md transition-transform active:scale-95 cursor-pointer z-20"
        >
          <Eye className="w-3.5 h-3.5 text-[#166534]" />
          <span>Inspect proof</span>
        </button>

        {/* Channel3 Merchant Badge */}
        {cause.channel3Product && (
          <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-full bg-surface/90 text-ink text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 shadow-md backdrop-blur-md">
            <ShoppingCart className="w-3.5 h-3.5 text-[#166534]" />
            <span>Channel3 · {cause.channel3Product.merchant}</span>
          </div>
        )}

        {/* Bottom Evidence Metadata Badges */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-[11px] text-white/90 flex items-center gap-1.5 shadow-xs">
            <Receipt className="w-3 h-3 text-emerald-400" />
            <span className="font-medium">PII redacted</span>
          </div>

          <div
            className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-emerald-400/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-xs"
            title={`100% routes directly to ${cause.receiverEmail}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[140px] font-semibold">{cause.receiverEmail}</span>
          </div>
        </div>
      </div>

      {/* 3. Deep Statement Details & Direct Progress Indicator */}
      <div className="p-5 sm:p-6 pt-4 bg-surface flex flex-col justify-end text-left z-10 border-t border-border">
        {/* Title */}
        <h3 className="text-lg sm:text-xl font-black text-ink leading-snug tracking-tight line-clamp-1 mb-1.5">
          {cause.title}
        </h3>

        {/* Human Backstory */}
        <p className="text-xs sm:text-[13px] text-ink-muted line-clamp-2 mb-4 leading-relaxed font-sans">
          {cause.description}
        </p>

        {/* Needed Hero Metric */}
        <div className="flex items-baseline justify-between mb-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-ink tabular-nums tracking-tight font-mono">
              {formatCurrency(remaining)}
            </span>
            <span className="text-xs uppercase font-mono font-bold text-ink-muted tracking-wider">
              needed
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs sm:text-sm font-mono font-black text-[#166534] block">
              {percentage}% funded
            </span>
            <span className="text-[11px] text-ink-muted font-mono block">
              of {formatCurrency(cause.goalAmount)}
            </span>
          </div>
        </div>

        {/* Apple-style Smooth Progress Bar with Ambient Glow */}
        <div className="relative w-full h-2.5 rounded-full bg-border-subtle/80 overflow-hidden mb-4 border border-border/80">
          <div
            className="h-full bg-gradient-to-r from-[#166534] via-emerald-600 to-emerald-500 rounded-full origin-left transition-transform duration-500 ease-out shadow-xs"
            style={{ transform: `scaleX(${percentage / 100})` }}
          />
        </div>

        {/* Gesture Guide Strip */}
        <div className="grid grid-cols-3 gap-1 pt-3 border-t border-border/60 text-[11px] text-ink-muted font-medium text-center">
          <div className="flex items-center justify-center gap-1 py-1">
            <ArrowLeft className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono text-[10px]">Left: Skip</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-1 text-amber-500 font-bold">
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">Up: Clear</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-1 text-[#166534] font-bold">
            <Heart className="w-3.5 h-3.5 fill-[#166534]" />
            <span className="font-mono text-[10px]">Right: $5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
