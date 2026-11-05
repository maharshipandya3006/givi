"use client";

import { ShieldCheck, MapPin, Eye, ShoppingCart } from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CauseCardProps {
  cause: Cause;
  onInspect: (cause: Cause) => void;
}

export function CauseCard({ cause, onInspect }: CauseCardProps) {
  const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);
  const percentage = Math.min(100, Math.round((cause.raisedAmount / cause.goalAmount) * 100));

  const categoryIcons: Record<string, string> = {
    utilities: "⚡",
    medical: "💊",
    education: "🎒",
    food: "🍞",
    climate: "🌱",
    community: "🤝",
  };

  return (
    <div className="relative w-full h-[580px] max-w-[420px] rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between text-white select-none transition-all">
      {/* Top Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryIcons[cause.category] || "❤️"}</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-200 tracking-tight leading-tight">
              {cause.receiverName}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-zinc-500" />
              {cause.receiverLocation}
            </span>
          </div>
        </div>

        {/* Gemini Trust Score Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{cause.trustScore.overall}% Verified</span>
        </div>
      </div>

      {/* Hero Media Preview */}
      <div className="relative flex-1 bg-zinc-950 overflow-hidden cursor-pointer group" onClick={() => onInspect(cause)}>
        <img
          src={cause.channel3Product?.imageUrl || cause.redactedProofUrl || cause.evidenceUrls[0]}
          alt={cause.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />

        {/* Inspect Button Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspect(cause);
          }}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-medium border border-white/20 flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Inspect Proof</span>
        </button>

        {/* Channel3 Retail Tag if applicable */}
        {cause.channel3Product && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-blue-600/80 backdrop-blur-md text-white text-xs font-medium border border-blue-400/30 flex items-center gap-1.5 shadow-lg">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Channel3 · {cause.channel3Product.merchant}</span>
          </div>
        )}
      </div>

      {/* Statement Details & Progress Body */}
      <div className="p-5 pt-3 bg-zinc-900 z-10 flex flex-col justify-end">
        {/* Title */}
        <h3 className="text-base font-bold text-zinc-100 leading-snug line-clamp-2 mb-2">
          {cause.title}
        </h3>

        {/* Human Backstory */}
        <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
          {cause.description}
        </p>

        {/* Statement Hero Amount */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {formatCurrency(remaining)}
            </span>
            <span className="text-xs text-zinc-400 uppercase font-mono">Needed</span>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            {percentage}% Funded
          </span>
        </div>

        {/* Dual-Tone Progress Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Gesture Guide Footnote */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
          <span className="hover:text-emerald-400 transition-colors">👉 Swipe Right: Chip in $5</span>
          <span className="hover:text-amber-400 transition-colors">👆 Up: Clear Ask</span>
        </div>
      </div>
    </div>
  );
}
