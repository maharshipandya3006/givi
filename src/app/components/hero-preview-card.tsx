"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import { DollarTapeStrip, DollarTapeCorner } from "@/components/ui/dollar-tape";

export function HeroPreviewCard() {
  const [tapePeeled, setTapePeeled] = useState(false);
  const [simulatedFunded, setSimulatedFunded] = useState(false);

  // 3D Tilt Physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleQuickTest = (e: React.MouseEvent) => {
    e.preventDefault();
    setSimulatedFunded(true);
    setTimeout(() => setSimulatedFunded(false), 3000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000 py-6">
      {/* Floating Dollar Tape across top right */}
      <div className="absolute -top-3 -right-2 z-40">
        <DollarTapeStrip
          angle={8}
          label="$$$$ VERIFIED STATEMENT $$$$"
          onPeelChange={(peeled) => setTapePeeled(peeled)}
        />
      </div>

      <motion.div
        className="relative rounded-3xl bg-zinc-950 border border-[#1f1f23] p-6 shadow-2xl text-left overflow-hidden transition-all duration-200"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Subtle corner tape tab */}
        <DollarTapeCorner corner="top-left" />

        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">DTE Energy Gas & Heat</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#118C4F]" />
              </div>
              <span className="text-xs text-zinc-500 font-mono">Detroit, MI · Shutoff Notice</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#118C4F]/10 border border-[#118C4F]/30 text-[#118C4F] text-[11px] font-mono font-bold">
            96% TRUST
          </span>
        </div>

        {/* Bill Visual Mockup & Peel Reveal Layer */}
        <div className="relative rounded-2xl bg-black border border-[#1f1f23] p-4 mb-4 overflow-hidden">
          {/* Default Statement View */}
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Past Due Statement
            </span>
            <span className="text-xs font-mono text-red-400 font-bold">URGENT</span>
          </div>

          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-2xl font-black text-white tracking-tight">
                {simulatedFunded ? "$279.10" : "$284.10"}
              </span>
              <span className="text-xs text-zinc-500 block">Original Ask: $284.10</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[#118C4F] font-semibold">
                {simulatedFunded ? "$195.00 raised" : "$190.00 raised"}
              </span>
              <span className="text-[10px] text-zinc-500 block">38 micro-donors</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-900 rounded-full h-2 mb-3 overflow-hidden border border-[#1f1f23]">
            <motion.div
              className="bg-[#118C4F] h-full rounded-full"
              initial={{ width: "66.8%" }}
              animate={{ width: simulatedFunded ? "68.6%" : "66.8%" }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Gemini AI OCR Verification Layer (Revealed when tape is peeled or toggled) */}
          <div
            className={`transition-all duration-300 rounded-xl p-3 border ${
              tapePeeled
                ? "bg-[#118C4F]/10 border-[#118C4F]/40"
                : "bg-zinc-900/60 border-[#1f1f23]"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <Sparkles className="w-3 h-3 text-[#118C4F]" />
                Gemini Vision OCR Inspection
              </span>
              <span className="text-[10px] font-mono text-[#118C4F]">
                {tapePeeled ? "TAPE PEELED · FULL AUDIT" : "TAP TAPE ABOVE TO AUDIT"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#118C4F]" />
                <span>Account: ***-8921</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#118C4F]" />
                <span>Doc Date: 48h ago</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#118C4F]" />
                <span>Vendor: DTE Energy</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#118C4F]" />
                <span>PII Redacted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleQuickTest}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              simulatedFunded
                ? "bg-white text-black"
                : "bg-[#118C4F] hover:bg-[#0e703f] text-white shadow-lg shadow-[#118C4F]/20"
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{simulatedFunded ? "Test $5 Disbursed!" : "Simulate $5 Gesture"}</span>
          </button>
          <Link
            href="/feed"
            className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-[#1f1f23] flex items-center gap-1 transition-colors"
          >
            <span>Live Deck</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

