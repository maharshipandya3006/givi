"use client";

import { useState, useEffect } from "react";
import { TransparencyGrid } from "./components/transparency-grid";
import { ShieldCheck, Layers, Loader2 } from "lucide-react";
import { TransparencyRecord } from "@/lib/types";

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/transparency");
        if (res.ok) {
          const logs = await res.json();
          setData(logs);
        }
      } catch (err) {
        console.warn("Could not fetch transparency records:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>AG Grid React Enterprise Audit Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Transparency & Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Every swipe dispatches 100% of funds directly to recipients via PayPal Payouts.
            Inspect verified settlement batch IDs, Gemini Trust Scores, and export tax records in 1 click.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-zinc-400">Platform Fee</div>
            <div className="text-base font-extrabold text-white font-mono">0.00% (Zero)</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="w-full h-96 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          <span>Loading public audit ledger...</span>
        </div>
      ) : (
        <TransparencyGrid initialData={data} />
      )}
    </div>
  );
}
