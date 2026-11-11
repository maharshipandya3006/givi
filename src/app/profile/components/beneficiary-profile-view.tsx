"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Receipt,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MapPin,
  LogOut,
  Zap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/utils";
import { Cause } from "@/lib/types";
import { getActiveCauses, filterBeneficiaryCauses } from "@/lib/causes-store";

export function BeneficiaryProfileView() {
  const {
    userId,
    userEmail,
    userName,
    donorPrefs,
    updateDonorPrefs,
    signOut,
    isJudgeBeneficiary,
    demoPersona,
  } = useUser();

  const isJudge = isJudgeBeneficiary || demoPersona === "judge_beneficiary";
  const defaultDisplayName = isJudge
    ? "Judge Beneficiary (Demo)"
    : donorPrefs.displayName || userName || "Verified Recipient";
  const defaultLocation = donorPrefs.location || "Detroit Metro, MI";
  const defaultPayoutEmail =
    donorPrefs.paypalEmail ||
    (isJudge ? "givibeneficiary@business.example.com" : userEmail || "givibeneficiary@business.example.com");

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(defaultDisplayName);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(defaultLocation);
  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [tempPayout, setTempPayout] = useState(defaultPayoutEmail);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [isLoadingCauses, setIsLoadingCauses] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/causes?status=all");
        if (res.ok) {
          const data = await res.json();
          setCauses(data);
        } else {
          setCauses(getActiveCauses());
        }
      } catch {
        setCauses(getActiveCauses());
      } finally {
        setIsLoadingCauses(false);
      }
    }
    load();
  }, []);

  const submittedLocalIds: string[] = typeof window !== "undefined"
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("givi_my_submitted_cause_ids") || "[]");
        } catch {
          return [];
        }
      })()
    : [];

  // Issue 9: Shared single-source beneficiary causes filter
  const myCauses = filterBeneficiaryCauses(causes, {
    userId,
    userEmail,
    paypalEmail: donorPrefs?.paypalEmail,
    isJudge,
    submittedLocalIds,
  });

  const totalReceived = myCauses.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);
  const billsClearedCount = myCauses.filter((c) => (c.raisedAmount || 0) >= (c.goalAmount || 1)).length;
  const activeNeedsCount = myCauses.length;

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await updateDonorPrefs({ displayName: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveLocation = async () => {
    if (tempLocation.trim()) {
      await updateDonorPrefs({ location: tempLocation.trim() });
    }
    setIsEditingLocation(false);
  };

  const handleSavePayout = async () => {
    if (tempPayout.trim() && tempPayout.includes("@")) {
      await updateDonorPrefs({ paypalEmail: tempPayout.trim() });
    }
    setIsEditingPayout(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* Receiver Profile Card */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#166534] via-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-emerald-sm shrink-0 border-2 border-surface">
            <Receipt className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-background border border-border text-sm font-bold text-ink"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 rounded-xl bg-[#166534] text-white text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 text-xs text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                    {donorPrefs.displayName || defaultDisplayName}
                  </h1>
                  <button
                    onClick={() => {
                      setTempName(donorPrefs.displayName || defaultDisplayName);
                      setIsEditingName(true);
                    }}
                    className="text-xs text-ink-muted hover:text-[#166534] font-medium"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#166534]/10 text-[#166534] border border-[#166534]/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Relief Recipient
              </span>

              <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-surface-elevated text-ink-muted border border-border flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#166534]" />
                {isEditingLocation ? (
                  <span className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempLocation}
                      onChange={(e) => setTempLocation(e.target.value)}
                      className="px-1 py-0.5 text-xs bg-background border border-border rounded"
                    />
                    <button onClick={handleSaveLocation} className="text-[#166534] font-bold">✓</button>
                  </span>
                ) : (
                  <span onClick={() => setIsEditingLocation(true)} className="cursor-pointer hover:underline">
                    {donorPrefs.location || defaultLocation}
                  </span>
                )}
              </span>

              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                Live PayPal Rail Active
              </span>
            </div>
          </div>
        </div>

        {/* Masked PII Privacy Badge */}
        <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-surface-elevated border border-border-subtle max-w-xs self-stretch sm:self-auto">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#166534]" />
              <span>Privacy Shield Active</span>
            </span>
            <span className="text-[10px] text-ink-muted leading-tight mt-0.5">
              Account numbers, meter IDs & home address are cryptographically masked before public listing.
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0" />
        </div>
      </div>

      {/* Receiver Metrics Bento Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Total Relief Received
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#166534] tabular-nums">
            {formatCurrency(totalReceived)}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            Direct via PayPal Payouts API v1
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Active Statement Needs
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-ink tabular-nums">
            {activeNeedsCount}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            Gemini Vision OCR Audited
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Bills Cleared in Full
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#166534] tabular-nums">
            {billsClearedCount}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            Direct Merchant Settlements
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Platform Take Rate
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#166534] tabular-nums">
            0.00%
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            100% Reaches Your Family
          </span>
        </div>
      </div>

      {/* Connected PayPal Direct Payout Rail Card */}
      <div className="w-full rounded-3xl bg-surface border border-border shadow-sm p-6 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#166534]/10 text-[#166534] flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Connected PayPal Payout Rail</h2>
              <p className="text-xs text-ink-muted">
                Micro-donations from community swipes deposit directly into this PayPal account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#166534] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#166534]">Instant Direct Deposit</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle col-span-2">
            <span className="text-[11px] font-mono uppercase text-ink-muted block mb-1 font-bold">
              Recipient PayPal Account
            </span>
            {isEditingPayout ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="email"
                  value={tempPayout}
                  onChange={(e) => setTempPayout(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono text-ink flex-1"
                />
                <button
                  onClick={handleSavePayout}
                  className="px-3 py-1.5 rounded-xl bg-[#166534] text-white text-xs font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingPayout(false)}
                  className="px-2 py-1.5 text-xs text-ink-muted"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-ink">
                  {donorPrefs.paypalEmail || defaultPayoutEmail}
                </span>
                <button
                  onClick={() => {
                    setTempPayout(donorPrefs.paypalEmail || defaultPayoutEmail);
                    setIsEditingPayout(true);
                  }}
                  className="text-xs text-[#166534] font-bold hover:underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle">
            <span className="text-[11px] font-mono uppercase text-ink-muted block mb-1 font-bold">
              Disbursement Method
            </span>
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#166534]" />
              <span>PayPal Payouts API v1</span>
            </span>
          </div>
        </div>
      </div>

      {/* Active Relief Claims Tracker */}
      <div className="w-full rounded-3xl bg-surface border border-border shadow-sm p-6 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-ink">Enrolled Statements & Aid Needs ({myCauses.length})</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Real-time progress of community micro-donations clearing your utility bills and essential needs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/create-cause"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#166534] text-white text-xs font-bold hover:bg-[#14532d] transition-all shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Enroll Need</span>
            </Link>
            <Link
              href="/my-causes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-elevated border border-border text-xs font-bold text-ink hover:bg-surface-highlight transition-all"
            >
              <span>Live Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {isLoadingCauses ? (
          <div className="py-8 text-center text-xs text-ink-muted font-mono animate-pulse">
            Loading enrolled relief requests...
          </div>
        ) : myCauses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-elevated border border-dashed border-border text-center flex flex-col items-center justify-center">
            <Receipt className="w-8 h-8 text-ink-muted mb-2 opacity-50" />
            <p className="text-xs font-bold text-ink">No relief requests enrolled yet</p>
            <p className="text-[11px] text-ink-muted mt-1 max-w-sm">
              Upload an overdue utility statement or infant formula need to start receiving direct community support.
            </p>
            <Link
              href="/create-cause"
              className="mt-4 px-4 py-2 rounded-xl bg-[#166534] text-white text-xs font-bold hover:bg-[#14532d] transition-colors"
            >
              Submit Relief Request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myCauses.map((c) => {
              const raised = c.raisedAmount || 0;
              const goal = c.goalAmount || 1;
              const pct = Math.min(100, Math.round((raised / goal) * 100));
              const isPaidInFull = raised >= goal;

              return (
                <div
                  key={c.id}
                  className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-[#166534]/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#166534]/10 text-[#166534]">
                        {c.category}
                      </span>
                      {isPaidInFull ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid in Full
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-border">
                          In Progress
                        </span>
                      )}
                      {c.trustScore && (
                        <span className="text-[10px] font-mono text-ink-muted">
                          {c.trustScore.overall}% Gemini Audited
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-ink truncate">{c.title}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden border border-border/50">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-[#166534] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-ink shrink-0">{pct}%</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border-subtle shrink-0">
                    <span className="text-xs text-ink-muted">Disbursed</span>
                    <span className="text-base font-black font-mono text-[#166534]">
                      {formatCurrency(raised)}
                      <span className="text-xs font-normal text-ink-muted"> / {formatCurrency(goal)}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gemini AI Multimodal Vision Audit & Security Card */}
      <div className="w-full rounded-3xl bg-surface-elevated border border-border p-6 sm:p-7 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#166534]/15 text-[#166534] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>Gemini 2.5 Flash Multimodal Vision Audit</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#166534] text-white">Verified</span>
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed mt-1">
              Every utility statement, prescription copay, and essential supply receipt submitted is analyzed by Gemini Multimodal Vision to authenticate genuine vendor statements, verify exact overdue balances, and mask account numbers before public community presentation.
            </p>
          </div>
        </div>

        <Link
          href="/transparency"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-ink hover:text-[#166534] transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>Audit Public Ledger</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Session Management & Sign Out */}
      <div className="w-full flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-ink-muted font-mono">
          Logged in as <strong className="text-ink">{userEmail || defaultPayoutEmail}</strong>
        </span>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-rose-500/10 hover:text-rose-600 text-ink-muted text-xs font-bold border border-border transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

