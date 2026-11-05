"use client";

import { ShieldCheck, MapPin, Eye, ShoppingCart, ArrowRight, ArrowUp } from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CauseCardProps {
  cause: Cause;
  onInspect: (cause: Cause) => void;
}

export function CauseCard({ cause, onInspect }: CauseCardProps) {
  const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);
  const percentage = Math.min(100, Math.round((cause.raisedAmount / cause.goalAmount) * 100));

  return (
    <div className="relative w-full h-[580px] max-w-[420px] rounded-3xl bg-zinc-950 border border-[#1f1f23] shadow-2xl overflow-hidden flex flex-col justify-between text-white select-none transition-all">
      {/* Top Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-[#1f1f23] bg-black/90 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-200 tracking-tight leading-tight">
            {cause.receiverName}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-[#118C4F]" />
            {cause.receiverLocation}
          </span>
        </div>

        {/* Gemini Trust Score Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#118C4F]/10 border border-[#118C4F]/30 text-[#118C4F] text-[11px] font-semibold font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#118C4F]" />
          <span>{cause.trustScore.overall}% Verified</span>
        </div>
      </div>

      {/* Hero Media Preview */}
      <div className="relative flex-1 bg-black overflow-hidden cursor-pointer group" onClick={() => onInspect(cause)}>
        <img
          src={cause.channel3Product?.imageUrl || cause.redactedProofUrl || cause.evidenceUrls[0]}
          alt={cause.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Inspect Button Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspect(cause);
          }}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-medium border border-[#1f1f23] flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
        >
          <Eye className="w-3.5 h-3.5 text-[#118C4F]" />
          <span>Inspect Proof</span>
        </button>

        {/* Channel3 Retail Tag if applicable */}
        {cause.channel3Product && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-zinc-200 text-xs font-medium border border-[#118C4F]/40 flex items-center gap-1.5 shadow-lg">
            <ShoppingCart className="w-3.5 h-3.5 text-[#118C4F]" />
            <span>Channel3 · {cause.channel3Product.merchant}</span>
          </div>
        )}
      </div>

      {/* Statement Details & Progress Body */}
      <div className="p-5 pt-3 bg-zinc-950 z-10 flex flex-col justify-end">
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
            <span className="text-xs text-zinc-500 uppercase font-mono">Needed</span>
          </div>
          <span className="text-xs font-mono font-semibold text-[#118C4F]">
            {percentage}% Funded
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden mb-4 border border-[#1f1f23]">
          <div
            className="h-full bg-[#118C4F] rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Gesture Guide Footnote */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-[#1f1f23]">
          <span className="flex items-center gap-1 text-zinc-400 hover:text-[#118C4F] transition-colors">
            <ArrowRight className="w-3 h-3 text-[#118C4F]" />
            Swipe Right: $5
          </span>
          <span className="flex items-center gap-1 text-zinc-400 hover:text-[#118C4F] transition-colors">
            <ArrowUp className="w-3 h-3 text-[#118C4F]" />
            Swipe Up: Clear Ask
          </span>
        </div>
      </div>
    </div>
  );
}
