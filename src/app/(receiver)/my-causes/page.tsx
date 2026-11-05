"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cause } from "@/lib/types";
import { getActiveCauses } from "@/lib/causes-store";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, Clock, ShieldCheck, ArrowRight } from "lucide-react";

export default function MyCausesPage() {
  const [causes, setCauses] = useState<Cause[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/causes");
        if (res.ok) {
          const data = await res.json();
          setCauses(data);
        } else {
          setCauses(getActiveCauses());
        }
      } catch (err) {
        setCauses(getActiveCauses());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between w-full mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Active Campaigns</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track real-time community micro-funding and PayPal instant payout disbursements.
          </p>
        </div>
        <Link
          href="/create-cause"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#118C4F] hover:bg-[#0e703f] text-white text-xs font-semibold shadow-md shadow-[#118C4F]/20 transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Cause</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="w-full p-12 text-center text-zinc-500 text-xs">Loading causes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {causes.slice(0, 4).map((c) => {
            const percentage = Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100));
            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-[#1f1f23] shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#118C4F]/10 text-[#118C4F] border border-[#118C4F]/30 font-semibold">
                      {c.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#118C4F] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {c.trustScore.overall}% Trust
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{c.title}</h3>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-zinc-400">Funding Progress</span>
                    <span className="text-xs font-mono font-bold text-[#118C4F]">
                      {formatCurrency(c.raisedAmount)} / {formatCurrency(c.goalAmount)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden mb-3 border border-[#1f1f23]">
                    <div
                      className="h-full bg-[#118C4F] rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1f1f23] flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 font-mono text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-[#118C4F]" />
                    Instant Payout Active
                  </span>
                  <span className="text-[#118C4F] hover:underline flex items-center gap-0.5">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
