"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  Terminal,
  Loader2,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useUser } from "@/lib/user-context";
import { AuthGate } from "@/components/ui/auth-gate";

interface AgentExecutionLog {
  causeId: string;
  causeTitle: string;
  amount: number;
  payoutBatchId: string;
  impactMessage: string;
  trustScore: number;
}

export default function AgentPage() {
  const { userId, userName, donorPrefs, updateDonorPrefs, refreshProfile } = useUser();
  const [budget, setBudget] = useState(50.0);
  const [maxPerCause, setMaxPerCause] = useState(15.0);
  const [minTrust, setMinTrust] = useState(85);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "utilities",
    "medical",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<AgentExecutionLog[]>([]);
  const [totalDisbursed, setTotalDisbursed] = useState<number | null>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleRunAgent = async () => {
    setIsRunning(true);
    setExecutionLogs([]);
    setTotalDisbursed(null);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: userId,
          donorName: userName || donorPrefs.displayName || "Kind Supporter",
          monthlyBudget: budget,
          maxPerCause,
          minTrustScore: minTrust,
          categories: selectedCategories,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExecutionLogs(data.payoutsExecuted || []);
        setTotalDisbursed(data.totalDisbursed);

        // Record agent disbursements into account's recent swipe history
        const agentSwipes = (data.payoutsExecuted || []).map((p: any) => ({
          causeId: p.causeId,
          title: p.causeTitle,
          amount: p.amount,
          category: p.category || "utilities",
          timestamp: p.timestamp || new Date().toISOString(),
          isAgentic: true,
          isFunded: Boolean(p.isFunded),
        }));

        if (typeof window !== "undefined" && agentSwipes.length > 0) {
          try {
            const raw = localStorage.getItem("givi_recent_transactions");
            const existing = raw ? JSON.parse(raw) : [];
            const updated = [...agentSwipes, ...(Array.isArray(existing) ? existing : [])];
            localStorage.setItem("givi_recent_transactions", JSON.stringify(updated));
            window.dispatchEvent(new Event("givi_transactions_updated"));
          } catch {}
        }

        const disbursed = Number(data.totalDisbursed || 0);
        const newBalance =
          typeof data.walletBalance === "number"
            ? data.walletBalance
            : Math.max(0, (donorPrefs.walletBalance || 0) - disbursed);
        const fundedCount = (data.payoutsExecuted || []).filter((p: any) => Boolean(p.isFunded)).length;

        await updateDonorPrefs({
          totalDonated: Math.round(((donorPrefs.totalDonated || 0) + disbursed) * 100) / 100,
          walletBalance: newBalance,
          billsCleared: (donorPrefs.billsCleared || 0) + fundedCount,
        });

        await refreshProfile();

        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#f59e0b", "#ffffff"],
        });
      } else {
        alert(data.error || "Autonomous agent run encountered an error.");
      }
    } catch (err) {
      console.error("Agent execution error:", err);
      alert("Failed to communicate with autonomous agent runner.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AuthGate
      title="Sign in to configure giving agent"
      description="Connect your Clerk account to set your monthly giving policies, trust criteria, and monitor automated PayPal micro-payouts."
    >
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-8 md:py-10 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-2">
          Autonomous giving agent
        </h1>
        <p className="text-sm text-ink-dim leading-relaxed">
          Delegate your monthly micro-giving budget to an autonomous agent that monitors urgent, high-trust
          statements and executes direct PayPal Payouts automatically without human delay.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full mb-8">
        {/* Left Column: Policy Configuration (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-surface border border-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-ink">
                Programmatic policy rules
              </h2>
            </div>

            {/* Monthly Budget */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline text-xs mb-2">
                <span className="text-ink-dim font-semibold">
                  Monthly giving budget
                </span>
                <span className="font-bold text-emerald-400 tabular-nums text-sm">
                  {formatCurrency(budget)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-border rounded-lg"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                Total monthly limit for autonomous disbursals
              </span>
            </div>

            {/* Max Per Cause */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline text-xs mb-2">
                <span className="text-ink-dim font-semibold">
                  Max donation per cause
                </span>
                <span className="font-bold text-emerald-400 tabular-nums text-sm">
                  {formatCurrency(maxPerCause)}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxPerCause}
                onChange={(e) => setMaxPerCause(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-border rounded-lg"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                Diversifies aid across multiple urgent families
              </span>
            </div>

            {/* Min Gemini Trust Threshold */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline text-xs mb-2">
                <span className="text-ink-dim font-semibold">
                  Minimum Gemini trust score
                </span>
                <span className="font-bold text-emerald-400 tabular-nums text-sm">
                  {minTrust}% verified
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                step="2"
                value={minTrust}
                onChange={(e) => setMinTrust(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-border rounded-lg"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                Requires utility OCR format & date verification before fund release
              </span>
            </div>

            {/* Category Preferences */}
            <div>
              <span className="text-xs font-semibold text-ink-dim block mb-2.5">
                Eligible categories
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
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${isChecked
                          ? "bg-[#166534] text-white border-[#166534] font-semibold shadow-sm"
                          : "bg-background border-border text-ink-muted hover:text-ink"
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
            className="w-full mt-8 py-4 px-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Agent scanning deck & executing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute autonomous giving cycle</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Execution Stream Terminal (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-surface border border-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-ink">
                  Autonomous execution stream
                </h2>
              </div>
              {totalDisbursed !== null && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  {formatCurrency(totalDisbursed)} disbursed
                </span>
              )}
            </div>

            {executionLogs.length === 0 ? (
              <div className="p-10 rounded-2xl bg-background border border-border text-center flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-ink-muted mb-4">
                  <Sparkles className="w-6 h-6 text-ink-muted" />
                </div>
                <span className="text-sm font-bold text-ink">
                  Autonomous agent idle
                </span>
                <p className="text-xs text-ink-muted mt-1 max-w-sm leading-relaxed">
                  Click &quot;Execute autonomous giving cycle&quot; to run. The
                  agent will scan causes in the database, filter by your policy rules, and disburse real-time PayPal Payouts.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-background border border-border flex flex-col gap-1.5 text-xs hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink line-clamp-1">
                        {log.causeTitle}
                      </span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(log.amount)}
                      </span>
                    </div>

                    <div className="text-xs text-ink-dim italic leading-snug">
                      &quot;{log.impactMessage}&quot;
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-ink-muted">
                      <span>PayPal: {log.payoutBatchId.slice(0, 18)}...</span>
                      <span className="text-emerald-400 font-semibold">
                        {log.trustScore}% verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span>All disbursements appear immediately on the live ledger:</span>
            <Link
              href="/transparency"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-0.5"
            >
              <span>Inspect audit ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
    </AuthGate>
  );
}
