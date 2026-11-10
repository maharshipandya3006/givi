"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Heart,
  Zap,
  Wallet,
  Flame,
  Pill,
  ShoppingBag,
  Baby,
  GraduationCap,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Lock,
  MapPin,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  FileText,
  CreditCard,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/utils";
import { Cause, CauseCategory, getGiverBadge } from "@/lib/types";
import { getActiveCauses } from "@/lib/causes-store";
import { AuthGate } from "@/components/ui/auth-gate";
import { WalletFundingModal } from "@/components/ui/wallet-funding-modal";
import { AnalyticsBento } from "@/components/ui/analytics-bento";

const bell = (x: number, m: number, s: number) => Math.exp(-(((x - m) / s) ** 2) / 2);
const hours = Array.from({ length: 25 }, (_, h) => h);

const INTEREST_METADATA: Record<
  CauseCategory,
  { label: string; icon: any; color: string; ink: "dark" | "light"; exampleItems: string[] }
> = {
  utilities: {
    label: "Heat & Electricity",
    icon: Flame,
    color: "#166534",
    ink: "light",
    exampleItems: ["Electric Bill", "Winter Gas"],
  },
  medical: {
    label: "Prescriptions & Copays",
    icon: Pill,
    color: "#10b981",
    ink: "dark",
    exampleItems: ["Prescriptions", "Medical Copays"],
  },
  food: {
    label: "Groceries & Nutrition",
    icon: ShoppingBag,
    color: "#86efac",
    ink: "dark",
    exampleItems: ["Family Groceries", "Community Pantry"],
  },
  community: {
    label: "Infant Care",
    icon: Baby,
    color: "#059669",
    ink: "light",
    exampleItems: ["Baby Formula", "Diaper Supply"],
  },
  education: {
    label: "School & Youth",
    icon: GraduationCap,
    color: "#d97706",
    ink: "dark",
    exampleItems: ["Classroom Supplies", "Youth Program"],
  },
  climate: {
    label: "Emergency Supplies",
    icon: AlertTriangle,
    color: "#f59e0b",
    ink: "dark",
    exampleItems: ["Shutoff Notice", "Emergency Blankets"],
  },
};

const ALL_INTERESTS: { id: CauseCategory; label: string; icon: any }[] = (
  Object.keys(INTEREST_METADATA) as CauseCategory[]
).map((id) => ({
  id,
  label: INTEREST_METADATA[id].label,
  icon: INTEREST_METADATA[id].icon,
}));

function BeneficiaryProfileView() {
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

  const myCauses = causes.filter((c) => {
    if (submittedLocalIds.includes(c.id)) return true;
    if (userId && userId !== "guest-session" && c.receiverId === userId) return true;

    if (isJudge && (c.id === "cause-dte-heat-01" || c.id === "cause-channel3-formula-04")) {
      return true;
    }

    if (
      userEmail &&
      userEmail !== "guest@givi.app" &&
      userEmail.toLowerCase() !== "givibeneficiary@business.example.com" &&
      c.receiverEmail?.toLowerCase() === userEmail.toLowerCase()
    ) {
      return true;
    }

    if (
      donorPrefs?.paypalEmail &&
      donorPrefs.paypalEmail.toLowerCase() !== "givibeneficiary@business.example.com" &&
      c.receiverEmail?.toLowerCase() === donorPrefs.paypalEmail.toLowerCase()
    ) {
      return true;
    }

    if ((userId === "guest-session" || !userId) && (c.receiverId === "guest-session" || c.receiverId === "user_guest")) return true;
    if (c.receiverId === "user_guest" && /^cause-\d{10,}/.test(c.id)) return true;
    return false;
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

export default function ProfilePage() {
  const {
    role,
    userId,
    userEmail,
    userName,
    donorPrefs,
    updateDonorPrefs,
    rechargeWallet,
    signOut,
    demoPersona,
    isJudgeDonor,
  } = useUser();

  const isJudge = demoPersona === "judge_donor" || isJudgeDonor;

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(isJudge ? "Judge Donor" : donorPrefs.displayName);

  useEffect(() => {
    if (isJudge) {
      setTempName("Judge Donor");
    } else if (donorPrefs.displayName && !isEditingName) {
      setTempName(donorPrefs.displayName);
    }
  }, [donorPrefs.displayName, isEditingName, isJudge]);

  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillInitialAmount, setRefillInitialAmount] = useState(50);
  const [localSwipes, setLocalSwipes] = useState<any[]>([]);

  const currentSwipeAmt = donorPrefs.defaultSwipeAmount || 5.0;
  const isCustomInitially = ![3.0, 5.0, 10.0].includes(currentSwipeAmt);
  const [isCustomSwipe, setIsCustomSwipe] = useState(isCustomInitially);
  const [customSwipeInput, setCustomSwipeInput] = useState(
    isCustomInitially ? currentSwipeAmt.toString() : "7.50"
  );

  const handleSelectSwipeAmount = (amt: number) => {
    setIsCustomSwipe(false);
    updateDonorPrefs({ defaultSwipeAmount: amt });
  };

  const handleCustomSwipeChange = (valStr: string) => {
    setCustomSwipeInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 50.0) {
      updateDonorPrefs({ defaultSwipeAmount: Math.round(parsed * 100) / 100 });
    }
  };

  useEffect(() => {
    function loadTransactions() {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("givi_recent_transactions");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setLocalSwipes(parsed);
            }
          }
        } catch {}
      }
    }
    loadTransactions();
    window.addEventListener("givi_transactions_updated", loadTransactions);
    return () => window.removeEventListener("givi_transactions_updated", loadTransactions);
  }, []);

  const rawLocalTotal = localSwipes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const localTotalGiven = rawLocalTotal;
  const localUniqueCauses = new Set(localSwipes.map((item) => item.causeId)).size;
  const cachedBills = typeof window !== "undefined" ? parseInt(localStorage.getItem(isJudge ? "givi_judge_donor_bills" : "givi_bills_cleared") || "0", 10) : 0;
  const localFundedCount = localSwipes.filter((x: any) => Boolean(x.isFunded) || (x.amount && Number(x.amount) > 5.0)).length;

  const judgeBase = 456.93;
  const judgeAgentSpent = isJudge && typeof donorPrefs.walletBalance === "number" && donorPrefs.walletBalance < 33
    ? Math.max(0, 33 - donorPrefs.walletBalance)
    : 0;

  const effectiveBillsCleared = Math.max(
    donorPrefs.billsCleared || 0,
    !isNaN(cachedBills) ? cachedBills : 0,
    localFundedCount,
    isJudge ? 9 : 0
  );

  const effectiveTotalDonated = Math.max(
    donorPrefs.totalDonated || 0,
    localTotalGiven,
    isJudge ? Math.round((judgeBase + judgeAgentSpent) * 100) / 100 : 0
  );

  const effectiveFamiliesRelieved = localUniqueCauses > 0
    ? localUniqueCauses
    : effectiveBillsCleared > 0
    ? effectiveBillsCleared
    : effectiveTotalDonated > 0
    ? Math.max(1, Math.ceil(effectiveTotalDonated / 5))
    : 0;

  const effectiveStreakDays = effectiveTotalDonated > 0 ? Math.max(1, donorPrefs.streakDays || 1) : 1;

  useEffect(() => {
    if (
      effectiveTotalDonated > (donorPrefs.totalDonated || 0) ||
      effectiveBillsCleared > (donorPrefs.billsCleared || 0)
    ) {
      updateDonorPrefs({
        totalDonated: effectiveTotalDonated,
        billsCleared: effectiveBillsCleared,
        streakDays: effectiveStreakDays,
      });
    }
  }, [effectiveTotalDonated, effectiveBillsCleared, donorPrefs.totalDonated, donorPrefs.billsCleared, effectiveStreakDays, updateDonorPrefs]);

  if (role === "beneficiary") {
    return (
      <AuthGate
        title="Sign in to view relief profile"
        description="Connect your account to access verified recipient details, direct PayPal payout destination, and enrolled statement tracker."
      >
        <BeneficiaryProfileView />
      </AuthGate>
    );
  }

  // Dynamically derive active passions from user selections (strictly showcase selected causes)
  const selectedInterests: CauseCategory[] = donorPrefs.interests || [];

  const activePassionMeta = selectedInterests.map((id) => ({
    id,
    ...(INTEREST_METADATA[id] || {
      label: id,
      icon: Flame,
      color: "#166534",
      ink: "light" as const,
      exampleItems: [id],
    }),
  }));

  const actualSwipeCount = localSwipes.length;
  const effectiveSwipeCount = actualSwipeCount > 0
    ? actualSwipeCount
    : effectiveTotalDonated > 0
    ? Math.ceil(effectiveTotalDonated / currentSwipeAmt)
    : Math.floor((donorPrefs.walletBalance || 0) / currentSwipeAmt);

  const numActive = activePassionMeta.length;
  // Fallback to monthly budget or a baseline pool if wallet balance is currently zeroed out
  const effectiveBudgetPool =
    (donorPrefs.monthlyBudget && donorPrefs.monthlyBudget > 0)
      ? donorPrefs.monthlyBudget
      : (donorPrefs.walletBalance && donorPrefs.walletBalance > 0)
      ? donorPrefs.walletBalance
      : (donorPrefs.defaultSwipeAmount || 5) * 10;

  const totalPool = numActive > 0 ? effectiveBudgetPool : 0;
  const weeklyTotal = numActive > 0 ? Math.round(totalPool * 0.25) : 0;
  const monthlyTotal = numActive > 0 ? totalPool : 0;

  const dynamicGroups = numActive > 0 ? activePassionMeta.map((p) => ({
    id: p.id,
    name: p.label,
    color: p.color,
    ink: p.ink,
  })) : [];

  const dynamicItems = numActive > 0 && totalPool > 0 ? activePassionMeta.flatMap((p) => {
    const shareWeekly = Math.max(1, Math.round(weeklyTotal / numActive));
    const shareMonthly = Math.max(1, Math.round(monthlyTotal / numActive));
    const sharePool = Math.max(1, Math.round(totalPool / numActive));

    return p.exampleItems.map((sub, idx) => ({
      name: sub,
      group: p.id,
      values: [
        idx === 0 ? Math.ceil(shareWeekly * 0.6) : Math.floor(shareWeekly * 0.4),
        idx === 0 ? Math.ceil(shareMonthly * 0.6) : Math.floor(shareMonthly * 0.4),
        idx === 0 ? Math.ceil(sharePool * 0.6) : Math.floor(sharePool * 0.4),
      ],
    }));
  }) : [];

  const dynamicRows = numActive > 0 ? activePassionMeta.map((p) => {
    const sharePool = totalPool > 0 ? Math.round(totalPool / numActive) : 0;
    const rule =
      donorPrefs.impactRadius === "local"
        ? "Local Neighbors"
        : p.id === "utilities" || p.id === "climate"
        ? "Most Urgent First"
        : "Critical Copays";
    return {
      label: p.label,
      values: ["High Priority", rule, `$${sharePool}.00`],
    };
  }) : [];

  const familiesRelieved = effectiveFamiliesRelieved;

  const giverLevelBadge = getGiverBadge(effectiveTotalDonated);

  const handleToggleInterest = (cat: CauseCategory) => {
    const current = donorPrefs.interests;
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    updateDonorPrefs({ interests: next });
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateDonorPrefs({ displayName: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const handleRechargeWallet = async (amount: number) => {
    await rechargeWallet(amount);
  };

  return (
    <AuthGate
      title="Sign in to view your profile"
      description="Manage your giving allowance, view verified impact receipts, and configure your payment preferences."
    >
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-5xl lg:max-w-6xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Donor Identity Card (Bumble/Hinge Style) */}
      <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 mb-6 shadow-card flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar with energetic glowing emerald ring */}
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#166534] to-[#14532d] p-0.5 shadow-sm">
              <div className="w-full h-full rounded-[22px] bg-surface-elevated flex items-center justify-center text-[#166534]">
                <User className="w-10 h-10 text-[#166534]" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#166534] flex items-center justify-center text-white border-2 border-surface">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-background border border-border text-sm text-ink"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2.5 py-1 rounded-lg bg-[#166534] text-white text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-ink tracking-tight">
                    {donorPrefs.isAnonymous
                      ? "Anonymous Giver"
                      : isJudge
                      ? "Judge Donor"
                      : donorPrefs.displayName || userName || "Kind Supporter"}
                  </h1>
                  {!isJudge && (
                    <button
                      onClick={() => {
                        setTempName(donorPrefs.displayName);
                        setIsEditingName(true);
                      }}
                      className="text-xs text-ink-muted hover:text-[#166534]"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#166534]/10 text-[#166534] border border-[#166534]/20">
                {isJudge ? "Judge Sandbox Evaluator" : giverLevelBadge}
              </span>
              <span className="text-xs text-ink-muted font-mono">
                {isJudge ? "PayPal Sandbox Evaluator" : donorPrefs.location || "Community Giver"}
              </span>
            </div>
          </div>
        </div>

        {/* Anonymous Mode Switch */}
        <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-surface-elevated border border-border-subtle">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#166534]" />
              <span>Give Anonymously</span>
            </span>
            <span className="text-[10px] text-ink-muted">
              Masks identity on feed & podium
            </span>
          </div>
          <input
            type="checkbox"
            checked={donorPrefs.isAnonymous}
            onChange={(e) => updateDonorPrefs({ isAnonymous: e.target.checked })}
            className="w-5 h-5 accent-[#166534] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Impact Stats Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Total Given
          </span>
          <span className="text-2xl font-black font-mono text-ink tabular-nums">
            {formatCurrency(effectiveTotalDonated)}
          </span>
          <span className="text-[11px] text-[#166534] block mt-1 font-mono font-bold">
            100% Direct Payouts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Bills Cleared
          </span>
          <span className="text-2xl font-black font-mono text-[#166534] tabular-nums">
            {effectiveBillsCleared}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            Paid in Full
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Families Relieved
          </span>
          <span className="text-2xl font-black font-mono text-ink tabular-nums">
            {effectiveFamiliesRelieved}
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            Neighbors supported
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm">
          <span className="text-xs font-semibold text-ink-muted block mb-1">
            Giving Streak
          </span>
          <span className="text-2xl font-black font-mono text-[#166534] tabular-nums">
            {effectiveStreakDays} Days
          </span>
          <span className="text-[11px] text-ink-muted block mt-1 font-mono">
            Active Community Giver
          </span>
        </div>
      </div>

      {/* Autonomous givi. Agent Banner */}
      <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#041a0e] via-[#082b19] to-[#041a0e] border border-emerald-500/25 p-5 sm:p-7 mb-8 text-white relative overflow-hidden shadow-card transition-all duration-300 hover:border-emerald-500/40 group">
        {/* Ambient Glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-16 w-56 h-56 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-1.5">
              Activate givi. Agent
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
              Let your givi. AI Agent donate on your behalf. Simply set your donation goal and preferences, and it will take care of the rest.
            </p>
          </div>

          <Link
            href="/agent"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 self-start md:self-auto"
          >
            <span>Activate givi. Agent</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Verified Giving Intelligence & Impact Analytics Bento */}
      <div className="w-full mb-8">
        <AnalyticsBento
          currency="$"
          revenue={{
            label: effectiveTotalDonated > 0 ? "Total Relief Given" : "Giving Allowance Balance",
            value: effectiveTotalDonated > 0 ? effectiveTotalDonated : donorPrefs.walletBalance,
            delta: effectiveTotalDonated > 0 ? "+100%" : `${Math.floor(donorPrefs.walletBalance / currentSwipeAmt)} Swipes Ready`,
            note: effectiveTotalDonated > 0 ? (
              <>
                Total Given: <span className="text-ink font-semibold">{formatCurrency(effectiveTotalDonated)}</span> · <span className="text-ink font-semibold">{formatCurrency(donorPrefs.walletBalance)}</span> balance
              </>
            ) : (
              <>
                Wallet Funded: <span className="text-ink font-semibold">{formatCurrency(donorPrefs.walletBalance)}</span> Available · 100% Direct Payouts
              </>
            ),
            caption: "Personal Allowance Pool",
            series: Array.from({ length: 30 }, (_, i) => {
              const val = i < 20 ? 0 : i === 20 ? 100 : i === 25 ? 250 : donorPrefs.walletBalance;
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              return {
                value: val,
                label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              };
            }),
          }}
          sessions={{
            label: "Personal Relief Swipes",
            value: effectiveSwipeCount,
            delta: `${effectiveStreakDays} ${effectiveStreakDays === 1 ? "Day" : "Days"} Streak`,
            note: effectiveBillsCleared > 0
              ? `${effectiveBillsCleared} bills cleared in full`
              : effectiveSwipeCount > 0
              ? `${effectiveSwipeCount} direct relief grants disbursed · ${Math.floor((donorPrefs.walletBalance || 0) / currentSwipeAmt)} ready in wallet`
              : `${Math.floor((donorPrefs.walletBalance || 0) / currentSwipeAmt)} swipes funded in givi. wallet (${formatCurrency(currentSwipeAmt)}/swipe)`,
            desktop: [0, 1].map((w) =>
              hours.map((h) =>
                effectiveSwipeCount > 0
                  ? Math.round(effectiveSwipeCount * (1 - w * 0.3) * (bell(h, 13, 3) + 0.1))
                  : h === 12 || h === 18
                  ? 2
                  : 0
              )
            ),
            mobile: [0, 1].map((w) =>
              hours.map((h) =>
                effectiveBillsCleared > 0
                  ? Math.round(effectiveBillsCleared * (bell(h, 20, 2) + 0.1))
                  : h === 19
                  ? 1
                  : 0
              )
            ),
            labels: {
              desktop: `Wallet Allowance (${formatCurrency(currentSwipeAmt)})`,
              mobile: "Super Swipe (Full)",
              prior: "Prior weeks",
              current: "this week",
            },
          }}
          categories={{
            title: "My Cause Passions & Budget Allocation",
            groups: dynamicGroups,
            periods: [
              {
                label: "Weekly",
                total: weeklyTotal,
                delta: numActive > 0 && weeklyTotal > 0 ? `${Math.round(weeklyTotal / currentSwipeAmt)} Swipes` : "0 Swipes",
                compare: numActive > 0 && weeklyTotal > 0 ? `${Math.round(weeklyTotal / currentSwipeAmt)} x ${formatCurrency(currentSwipeAmt)} micro-grants` : (donorPrefs.walletBalance || 0) === 0 ? "Wallet depleted ($0.00)" : "0 causes selected",
              },
              {
                label: "Monthly",
                total: monthlyTotal,
                delta: numActive > 0 && monthlyTotal > 0 ? `${Math.round(monthlyTotal / currentSwipeAmt)} Swipes` : "0 Swipes",
                compare: numActive > 0 && monthlyTotal > 0 ? `${Math.round(monthlyTotal / currentSwipeAmt)} x ${formatCurrency(currentSwipeAmt)} micro-grants` : (donorPrefs.walletBalance || 0) === 0 ? "Wallet depleted ($0.00)" : "0 causes selected",
              },
              {
                label: "Total Pool",
                total: totalPool,
                delta: numActive > 0 && totalPool > 0 ? `${Math.round(totalPool / currentSwipeAmt)} Swipes` : "0 Swipes",
                compare: totalPool > 0 ? "Available in givi. wallet" : "Refill wallet to allocate",
              },
            ],
            items: dynamicItems,
            table: {
              columns: ["My Active Passion", "Priority", "Routing Rule", "Allocated Budget"],
              rows: dynamicRows,
            },
          }}
          seasonality={{
            title: "My Giving Plan & Connected Rails",
            years: [
              {
                label: "2026",
                values: [40, 45, 50, 35, 40, 45, 50, 45, 40, 35, 40, 45],
                stats: [
                  {
                    label: "Monthly Target",
                    value: Math.round((donorPrefs.walletBalance || 0) / 12),
                    delta: (donorPrefs.walletBalance || 0) > 0 ? "Active" : "Depleted",
                    note: (donorPrefs.walletBalance || 0) > 0 ? `from $${donorPrefs.walletBalance} wallet` : "Wallet $0.00 balance",
                  },
                  {
                    label: "Allowance Pool",
                    value: donorPrefs.walletBalance || 0,
                    delta: (donorPrefs.walletBalance || 0) > 0 ? "Funded" : "Empty",
                    note: (donorPrefs.walletBalance || 0) > 0 ? "100% Direct Payouts" : "Refill wallet to activate",
                  },
                ],
                rows: [
                  { label: "Routing Direction", value: donorPrefs.impactRadius === "local" ? "Local Neighbors" : "Most Urgent First" },
                  { label: "Giving Streak", value: `${effectiveStreakDays} ${effectiveStreakDays === 1 ? "Day" : "Days"} Active` },
                  { label: "Bills Cleared", value: `${effectiveBillsCleared} Paid in Full` },
                ],
              },
            ],
          }}
          colors={{
            revenue: ["#166534", "#10b981"],
            desktop: ["#166534", "#10b981"],
            mobile: ["#f59e0b", "#10b981"],
            radar: "#166534",
          }}
          credit={false}
        />
      </div>

      {/* Giving Allowance Wallet */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#166534]" />
            <h2 className="text-base font-extrabold text-ink">
              Giving Allowance Wallet
            </h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-5">
          <div>
            <span className="text-3xl font-black font-mono text-[#166534] tabular-nums">
              {formatCurrency(donorPrefs.walletBalance)}
            </span>
            <span className="text-xs text-ink-muted ml-2">Available</span>
          </div>
          <button
            onClick={() => {
              setRefillInitialAmount(50);
              setIsRefillModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Refill Wallet</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:max-w-md">
          <button
            onClick={() => {
              setRefillInitialAmount(25);
              setIsRefillModalOpen(true);
            }}
            className="flex-1 py-2 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-ink text-xs font-bold border border-border-subtle transition-colors cursor-pointer"
          >
            +$25.00
          </button>
          <button
            onClick={() => {
              setRefillInitialAmount(50);
              setIsRefillModalOpen(true);
            }}
            className="flex-1 py-2 rounded-xl bg-[#166534]/15 hover:bg-[#166534]/25 text-[#166534] text-xs font-bold border border-[#166534]/30 transition-colors cursor-pointer"
          >
            +$50.00
          </button>
          <button
            onClick={() => {
              setRefillInitialAmount(100);
              setIsRefillModalOpen(true);
            }}
            className="flex-1 py-2 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-ink text-xs font-bold border border-border-subtle transition-colors cursor-pointer"
          >
            +$100.00
          </button>
        </div>

        {/* Standard Swipe Amount Selector */}
        <div className="pt-5 border-t border-border-subtle mt-5">
          <div className="mb-2">
            <label className="text-xs font-bold text-ink">
              Standard Swipe Amount
            </label>
          </div>
          <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
            Choose how much is disbursed directly to verified recipients on each swipe right.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {[
              { amt: 3.0, label: "$3.00", sub: "Light" },
              { amt: 5.0, label: "$5.00", sub: "Standard" },
              { amt: 10.0, label: "$10.00", sub: "Boost" },
            ].map((tier) => {
              const isSelected = !isCustomSwipe && currentSwipeAmt === tier.amt;
              return (
                <button
                  key={tier.amt}
                  type="button"
                  onClick={() => handleSelectSwipeAmount(tier.amt)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${
                    isSelected
                      ? "bg-[#166534]/15 border-[#166534] text-ink font-bold shadow-sm ring-1 ring-[#166534]"
                      : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:bg-surface-highlight"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black block tabular-nums">
                    {tier.label}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5 font-medium">
                    {tier.sub}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsCustomSwipe(true);
                const parsed = parseFloat(customSwipeInput);
                if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 50.0) {
                  updateDonorPrefs({ defaultSwipeAmount: Math.round(parsed * 100) / 100 });
                }
              }}
              className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${
                isCustomSwipe
                  ? "bg-[#166534]/15 border-[#166534] text-ink font-bold shadow-sm ring-1 ring-[#166534]"
                  : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:bg-surface-highlight"
              }`}
            >
              <span className="text-xs sm:text-sm font-black block">Custom</span>
              <span className="text-[10px] text-ink-muted block mt-0.5 font-medium">$1 – $50</span>
            </button>
          </div>

          {/* Inline Custom Input when Custom is selected */}
          {isCustomSwipe && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-surface-elevated border border-border-subtle animate-in fade-in duration-150">
              <span className="text-xs font-bold text-ink-muted font-mono">$</span>
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={customSwipeInput}
                onChange={(e) => handleCustomSwipeChange(e.target.value)}
                placeholder="e.g. 7.50"
                className="w-28 px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs font-bold font-mono text-ink focus:outline-none focus:border-[#166534]"
              />
              <span className="text-[11px] text-ink-muted">
                (Min $1.00 · Max $50.00 micro-grant protection)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Preferences Grid: Cause Passions & Relief Routing */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
        {/* Left: Cause Passions & Algorithm Preferences */}
        <div className="p-6 sm:p-7 rounded-3xl bg-surface border border-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-ink">
                My Cause Passions (Swipe Algorithm Tuning)
              </h2>
            </div>
            <p className="text-xs text-ink-muted mb-5 leading-relaxed">
              Givi prioritizes causes matching your active badges in the main swipe feed.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {ALL_INTERESTS.map((interest) => {
                const Icon = interest.icon;
                const isSelected = donorPrefs.interests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => handleToggleInterest(interest.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? "bg-[#166534] text-white border-[#166534] shadow-sm scale-[1.02]"
                        : "bg-surface-elevated text-ink-muted border-border hover:text-ink hover:bg-surface-highlight"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-ink-muted"}`} />
                    <span>{interest.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Relief Routing Priority Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-surface border border-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-ink">
                Relief Routing Priority
              </h2>
            </div>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed">
              Choose whether your swipe deck prioritizes imminent shutoff bills or neighbors in your home state.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => updateDonorPrefs({ impactRadius: "urgent" })}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  (donorPrefs.impactRadius || "urgent") === "urgent"
                    ? "bg-[#166534]/10 border-[#166534] text-ink shadow-sm ring-1 ring-[#166534]/20"
                    : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:bg-surface-highlight"
                }`}
              >
                <Zap className="w-4 h-4 text-[#166534] mb-2" />
                <span className="text-xs font-bold block text-ink">Most urgent first</span>
                <span className="text-[11px] text-ink-muted block mt-0.5 leading-snug">
                  Imminent shutoff notices & critical copays
                </span>
              </button>

              <button
                type="button"
                onClick={() => updateDonorPrefs({ impactRadius: "local" })}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  donorPrefs.impactRadius === "local"
                    ? "bg-[#166534]/10 border-[#166534] text-ink shadow-sm ring-1 ring-[#166534]/20"
                    : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:bg-surface-highlight"
                }`}
              >
                <MapPin className="w-4 h-4 text-[#166534] mb-2" />
                <span className="text-xs font-bold block text-ink">Local neighbors</span>
                <span className="text-[11px] text-ink-muted block mt-0.5 leading-snug">
                  Prioritize verified causes in your city or state
                </span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-semibold text-ink-muted block mb-1.5">
              Your City, State (Optional)
            </label>
            <input
              type="text"
              defaultValue={donorPrefs.location || ""}
              onBlur={(e) => updateDonorPrefs({ location: e.target.value.trim() })}
              placeholder="e.g. Austin, TX or Detroit, MI"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-border text-xs text-ink focus:outline-none focus:border-[#166534] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Recent Swipes Activity Stream (isolated from Judge Donor sandbox) */}
      {!isJudge && localSwipes.length > 0 && (
        <div className="w-full p-6 sm:p-7 rounded-3xl bg-surface border border-border shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 fill-current" />
                <span>My Swiped Impact ({localSwipes.length})</span>
              </h2>
              <p className="text-xs text-ink-muted">
                Direct PayPal micro-relief payments disbursed from your giving swipes.
              </p>
            </div>
            <Link
              href="/transparency"
              className="text-xs font-semibold text-[#166534] hover:underline flex items-center gap-1"
            >
              <span>Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {localSwipes.slice(0, 5).map((swipe) => (
              <div key={swipe.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ink truncate">
                    {swipe.causeTitle}
                  </div>
                  <div className="text-[11px] text-ink-muted flex items-center gap-2 mt-0.5">
                    <span className="capitalize">{swipe.category}</span>
                    <span>•</span>
                    <span className="font-mono">{swipe.receiverEmail || "PayPal Rail"}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black font-mono text-[#166534]">
                    {formatCurrency(swipe.amount)}
                  </div>
                  <div className="text-[10px] text-ink-muted font-mono">
                    {new Date(swipe.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Session & Sign Out */}
      <div className="w-full p-5 rounded-3xl bg-surface border border-border shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-ink-muted">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Account Session</h3>
            <span className="text-xs text-ink-muted font-mono">
              {userEmail || "Signed in"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await signOut();
            } catch (e) {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>

      <WalletFundingModal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        initialAmount={refillInitialAmount}
        title="Refill givi. Wallet"
        description="Add funds to your Giving Allowance using PayPal or Card. Sliders and custom amounts supported with zero extra charges."
      />
    </div>
    </AuthGate>
  );
}

