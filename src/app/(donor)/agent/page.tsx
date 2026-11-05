"use client";

import { useState } from "react";
import { Sparkles, Zap, ShieldCheck, Play, Loader2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AgentRunLog } from "@/app/api/agent/run/route";
import Link from "next/link";

export default function AgentPage() {
  const [budget, setBudget] = useState(50);
  const [maxPerCause, setMaxPerCause] = useState(15);
  const [minTrust, setMinTrust] = useState(85);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "utilities",
    "medical",
    "food",
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<AgentRunLog[]>([]);
  const [totalDisbursed, setTotalDisbursed] = useState<number | null>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleRunAgent = async () => {
    setIsRunning(true);
    setExecutionLogs([]);
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxAmountPerCause: maxPerCause,
          minTrustScore: minTrust,
          categories: selectedCategories,
          maxTotalBudget: budget,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExecutionLogs(data.logs);
        setTotalDisbursed(data.totalDisbursed);
      } else {
        alert("Agent runner encountered an error.");
      }
    } catch (err) {
      console.error("Agent run error:", err);
      alert("Failed to execute agent run.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#118C4F]/10 border border-[#118C4F]/30 text-[#118C4F] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#118C4F]" />
          <span>Agentic Commerce Track · Autonomous Payouts</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Givi Autonomous Giving Agent
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
          Delegate your monthly micro-giving budget to an AI agent that monitors urgent, high-trust
          statements and executes PayPal Payouts autonomously.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
        {/* Left: Policy Configuration */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-[#1f1f23] shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#118C4F]" />
              <span>Programmatic Giving Policy</span>
            </h2>

            {/* Monthly Budget */}
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-semibold">Monthly Impact Pool</span>
                <span className="font-bold font-mono text-[#118C4F]">{formatCurrency(budget)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-[#118C4F] cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 font-mono">Auto-replenishes every 30 days</span>
            </div>

            {/* Max Per Cause */}
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-semibold">Max Micro-Payout per Cause</span>
                <span className="font-bold font-mono text-[#118C4F]">{formatCurrency(maxPerCause)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxPerCause}
                onChange={(e) => setMaxPerCause(Number(e.target.value))}
                className="w-full accent-[#118C4F] cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 font-mono">
                Spreads impact across multiple urgent families
              </span>
            </div>

            {/* Min Gemini Trust Threshold */}
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-semibold">Minimum Gemini Trust Score</span>
                <span className="font-bold font-mono text-[#118C4F]">{minTrust}% Verified</span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                step="2"
                value={minTrust}
                onChange={(e) => setMinTrust(Number(e.target.value))}
                className="w-full accent-[#118C4F] cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 font-mono">
                Guarantees OCR format & date verification before fund release
              </span>
            </div>

            {/* Category Preferences */}
            <div>
              <span className="text-xs font-semibold text-zinc-300 block mb-2">
                Eligible Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "utilities", label: "Utilities" },
                  { id: "medical", label: "Medical" },
                  { id: "food", label: "Groceries" },
                  { id: "education", label: "Education" },
                  { id: "community", label: "Community" },
                ].map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        isChecked
                          ? "bg-[#118C4F]/10 border-[#118C4F] text-[#118C4F] font-semibold"
                          : "bg-black border-[#1f1f23] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            className="w-full mt-6 py-3.5 px-4 rounded-2xl bg-[#118C4F] hover:bg-[#0e703f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#118C4F]/20 transition-all hover:scale-[1.01]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agent Scanning Causes...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Trigger Autonomous Run Now</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Real-Time Execution Logs */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-[#1f1f23] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#118C4F]" />
                <span>Autonomous Execution Stream</span>
              </h2>
              {totalDisbursed !== null && (
                <span className="text-xs font-mono font-bold text-[#118C4F] bg-[#118C4F]/10 px-2 py-0.5 rounded-full border border-[#118C4F]/30">
                  {formatCurrency(totalDisbursed)} Disbursed
                </span>
              )}
            </div>

            {executionLogs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black border border-[#1f1f23] text-center flex flex-col items-center justify-center min-h-[260px]">
                <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
                <span className="text-xs font-semibold text-zinc-400">Agent Idle</span>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  Click &quot;Trigger Autonomous Run Now&quot; to simulate an automated hourly execution. The
                  agent will scan active causes and disburse PayPal Payouts directly.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-black border border-[#1f1f23] flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 line-clamp-1">
                        {log.causeTitle}
                      </span>
                      <span className="font-bold font-mono text-[#118C4F]">
                        {formatCurrency(log.amount)}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 italic leading-snug">
                      &quot;{log.impactMessage}&quot;
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#1f1f23] text-[10px] font-mono text-zinc-500">
                      <span>PayPal: {log.payoutBatchId.slice(0, 16)}...</span>
                      <span className="text-[#118C4F]">{log.trustScore}% Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1f1f23] flex items-center justify-between text-xs text-zinc-400">
            <span>Every transaction appears live on the audit grid:</span>
            <Link
              href="/transparency"
              className="text-[#118C4F] hover:underline flex items-center gap-1 font-semibold"
            >
              Audit Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
