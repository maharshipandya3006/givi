"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Zap,
  ShieldCheck,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Flame,
  Pill,
  ShoppingBag,
  Baby,
  GraduationCap,
  AlertTriangle,
  QrCode,
  Check,
  Wallet,
  CreditCard,
  PlusCircle,
  Mail,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useUser } from "@/lib/user-context";
import { CauseCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { WalletFundingModal } from "@/components/ui/wallet-funding-modal";
import AdmitOneTicket from "@/components/ui/admit-one-ticket";

interface CauseOption {
  id: CauseCategory;
  label: string;
  icon: any;
  example: string;
  urgentNote: string;
}

const CAUSE_OPTIONS: CauseOption[] = [
  {
    id: "utilities",
    label: "Heat & Winter Power",
    icon: Flame,
    example: "Overdue electric & gas shutoff notices",
    urgentNote: "Average: $95 to $140",
  },
  {
    id: "medical",
    label: "Essential Prescriptions",
    icon: Pill,
    example: "Insulin, inhalers & lifesaving copays",
    urgentNote: "Average: $25 to $80",
  },
  {
    id: "food",
    label: "Family Groceries",
    icon: ShoppingBag,
    example: "Pantry relief & essential nutrition",
    urgentNote: "Average: $40 to $75",
  },
  {
    id: "climate",
    label: "Emergency Supplies",
    icon: AlertTriangle,
    example: "Space heaters, cold blankets & winter boots",
    urgentNote: "Average: $35 to $90",
  },
  {
    id: "community",
    label: "Infant & Child Care",
    icon: Baby,
    example: "Baby formula, diapers & crib supplies",
    urgentNote: "Average: $30 to $65",
  },
  {
    id: "education",
    label: "Youth & Schooling",
    icon: GraduationCap,
    example: "Textbooks, uniforms & classroom gear",
    urgentNote: "Average: $20 to $50",
  },
];

export default function DonorOnboardingPage() {
  const router = useRouter();
  const {
    updateDonorPrefs,
    activateGuestProfile,
    setDonorOnboarded,
    setRole,
    enableDemoSession,
    userId,
    donorPrefs,
    isClerkSignedIn,
    demoPersona,
  } = useUser();

  const isJudgeMode = demoPersona === "judge_donor" || demoPersona === "judge_beneficiary";

  // Authenticated Clerk users bypass onboarding and go directly to their feed
  useEffect(() => {
    if (isClerkSignedIn && !isJudgeMode) {
      router.replace("/feed");
    }
  }, [isClerkSignedIn, isJudgeMode, router]);

  const [step, setStep] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<CauseCategory[]>([
    "utilities",
    "medical",
  ]);
  const [swipeAmount, setSwipeAmount] = useState<number>(5.0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(50.0);
  const paymentPreference = "wallet" as const;
  const [impactRadius, setImpactRadius] = useState<"urgent" | "local" | "national">("urgent");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [location, setLocation] = useState<string>(donorPrefs.location || "");
  const [displayName, setDisplayName] = useState<string>("");
  const [showGivingPass, setShowGivingPass] = useState<boolean>(false);
  const [restoredExistingAccount, setRestoredExistingAccount] = useState<boolean>(false);
  const [isRestoringAccount, setIsRestoringAccount] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletRefillInitial, setWalletRefillInitial] = useState<number>(50);
  const [ticketWidth, setTicketWidth] = useState<number>(500);
  const ticketContainerRef = useRef<HTMLDivElement>(null);
  const lookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nameRef = useRef<string>(displayName);
  nameRef.current = displayName;

  useEffect(() => {
    return () => {
      if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    };
  }, []);

  const performNameLookup = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === "Kind Supporter" || trimmed === "Applicant") {
      setRestoredExistingAccount(false);
      return;
    }
    setIsRestoringAccount(true);
    try {
      const result = await activateGuestProfile(trimmed, { fromOnboarding: true });
      if (nameRef.current.trim() !== trimmed) return;

      if (result.restored) {
        setRestoredExistingAccount(true);
        if (result.preferences) {
          if (Array.isArray(result.preferences.interests) && result.preferences.interests.length > 0) {
            setSelectedInterests(result.preferences.interests);
          }
          if (typeof result.preferences.defaultSwipeAmount === "number") {
            setSwipeAmount(result.preferences.defaultSwipeAmount);
          }
          if (typeof result.preferences.monthlyBudget === "number") {
            setMonthlyBudget(result.preferences.monthlyBudget);
          }
          if (result.preferences.location) {
            setLocation(result.preferences.location);
          }
          if (result.preferences.impactRadius) {
            setImpactRadius(result.preferences.impactRadius as any);
          }
        }
      } else {
        setRestoredExistingAccount(false);
      }
    } catch (e) {
      console.warn("Guest profile lookup failed:", e);
    } finally {
      if (nameRef.current.trim() === trimmed) {
        setIsRestoringAccount(false);
      }
    }
  };

  const handleNameChange = (val: string) => {
    setDisplayName(val);
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    if (val.trim().length >= 2) {
      lookupTimeoutRef.current = setTimeout(() => {
        performNameLookup(val);
      }, 400);
    } else {
      setRestoredExistingAccount(false);
    }
  };

  const handleNameBlur = () => {
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    if (displayName.trim()) {
      performNameLookup(displayName);
    }
  };

  useEffect(() => {
    if (!showGivingPass || !ticketContainerRef.current) return;
    const updateSize = () => {
      if (ticketContainerRef.current) {
        const clientW = ticketContainerRef.current.clientWidth;
        if (clientW > 0) {
          setTicketWidth(Math.min(Math.max(clientW - 16, 280), 510));
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(([entry]) => {
      if (entry?.contentBoxSize?.[0]) {
        const w = Math.min(Math.max(Math.floor(entry.contentBoxSize[0].inlineSize) - 8, 280), 510);
        setTicketWidth(w);
      }
    });
    observer.observe(ticketContainerRef.current);
    return () => observer.disconnect();
  }, [showGivingPass]);

  const toggleInterest = (id: CauseCategory) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    const trimmedName = displayName.trim();
    if (!isAnonymous && !trimmedName) {
      return;
    }

    const onboardingUpdates = {
      interests: selectedInterests,
      defaultSwipeAmount: swipeAmount,
      monthlyBudget: monthlyBudget,
      paymentPreference: paymentPreference,
      impactRadius: impactRadius,
      isAnonymous: isAnonymous,
      displayName: isAnonymous ? "Anonymous Giver" : trimmedName,
      location: location.trim(),
      onboarded: true,
    };

    if (!isAnonymous && trimmedName && (!userId || !userId.startsWith("user_"))) {
      const result = await activateGuestProfile(trimmedName, {
        fromOnboarding: true,
        onboardingUpdates,
      });
      setRestoredExistingAccount(result.restored);
    } else {
      await updateDonorPrefs(onboardingUpdates);
      setRestoredExistingAccount(false);
    }
    setRole("donor");
    setDonorOnboarded(true);
    enableDemoSession("donor");

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#166534", "#22c55e", "#ffffff", "#f59e0b"],
    });

    setShowGivingPass(true);
  };

  const handleLaunchFeed = () => {
    enableDemoSession("donor");
    router.push("/feed");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 py-8 sm:py-12 max-w-2xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Step Indicators */}
      {!showGivingPass && (
        <div className="w-full flex items-center justify-between mb-8 max-w-sm">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s
                  ? "bg-[#166534] text-white shadow-sm"
                  : step > s
                    ? "bg-[#166534]/20 text-[#166534] border border-[#166534]/40"
                    : "bg-surface-elevated text-ink-muted border border-border"
                  }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className="text-xs font-medium text-ink-muted hidden sm:inline">
                {s === 1 ? "Causes" : s === 2 ? "Giving Mode" : "Identity"}
              </span>
              {s < 3 && <div className="w-8 sm:w-12 h-px bg-border" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Cause Selection */}
      {step === 1 && !showGivingPass && (
        <div className="w-full max-w-xl flex flex-col my-auto motion-safe:animate-in fade-in duration-200">
          {/* Donor Identity Input (Step 1 First) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-card mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="donor-step1-name" className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#166534]" />
                <span>Your Donor Name</span>
              </label>
              {isRestoringAccount ? (
                <span className="text-xs text-[#166534] font-medium flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verifying account...
                </span>
              ) : restoredExistingAccount ? (
                <span className="text-xs text-[#166534] font-bold flex items-center gap-1 bg-[#166534]/15 px-2.5 py-0.5 rounded-full border border-[#166534]/30">
                  <Sparkles className="w-3 h-3" /> Account Restored ({formatCurrency(donorPrefs.walletBalance)})
                </span>
              ) : (
                <span className="text-[11px] text-ink-muted">Enter to resume or start fresh</span>
              )}
            </div>
            <input
              id="donor-step1-name"
              type="text"
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Enter your name (e.g. Mahi or Eddie)"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors font-medium"
            />
            {restoredExistingAccount && (
              <div className="mt-3 p-3 rounded-xl bg-[#166534]/10 border border-[#166534]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#166534] animate-in fade-in duration-200">
                <span className="font-semibold">
                  Welcome back, {displayName.trim()}! Balance: <strong>{formatCurrency(donorPrefs.walletBalance)}</strong> · Giving history restored.
                </span>
                <span className="text-[11px] text-[#166534]/80">Passions pre-selected below</span>
              </div>
            )}
          </div>

          <div className="text-center sm:text-left mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-2">
              Select relief passions
            </h1>
            <p className="text-sm text-ink-dim leading-relaxed">
              Every verified statement in Givi is settled 100% directly to families via PayPal. Choose what matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {CAUSE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedInterests.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInterest(opt.id)}
                  className={`p-4 rounded-2xl border text-left transition-colors relative flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${isSelected
                    ? "bg-[#166534]/10 border-[#166534] text-ink shadow-sm"
                    : "bg-surface border-border text-ink-muted hover:border-ink-muted"
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected
                        ? "bg-[#166534] text-white"
                        : "bg-surface-elevated text-ink-muted"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#166534] text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-sm text-ink block mb-1">
                      {opt.label}
                    </span>
                    <span className="text-xs text-ink-muted block leading-relaxed mb-2">
                      {opt.example}
                    </span>
                    <span className="text-[11px] text-[#166534] font-medium block">
                      {opt.urgentNote}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={selectedInterests.length === 0}
            className="w-full py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
          >
            <span>Continue to giving mode</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Giving Style & Payment Preference */}
      {step === 2 && !showGivingPass && (
        <div className="w-full max-w-xl flex flex-col my-auto motion-safe:animate-in fade-in duration-200">
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-2">
              Your giving mode & style
            </h1>
            <p className="text-sm text-ink-dim leading-relaxed">
              Every swipe right is an instant direct PayPal transfer. Select how you prefer to fund your swipes.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card mb-8">
            {/* Giving Architecture Showcase */}
            <div className="mb-8">
              <label className="text-sm font-bold text-ink block mb-3">
                PayPal Micro-Relief Architecture
              </label>
              <div className="p-4 sm:p-5 rounded-2xl bg-[#166534]/10 border border-[#166534] text-ink ring-1 ring-[#166534]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-ink flex items-center gap-2">
                    <Wallet className="w-4.5 h-4.5 text-[#166534]" />
                    <span>In-App givi. Giving Allowance</span>
                  </span>
                  <Check className="w-4 h-4 text-[#166534]" />
                </div>
                <span className="text-[13px] text-ink-muted leading-relaxed block mt-1">
                  Fund your Giving Allowance via PayPal Checkout once. Enables instantaneous card swiping with zero popups or payment interruptions.
                </span>
              </div>
            </div>

            {/* Standard Swipe Amount */}
            <div className="mb-8">
              <label className="text-sm font-bold text-ink block mb-3">
                Standard swipe amount
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[3.0, 5.0, 10.0].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSwipeAmount(amt)}
                    className={`p-4 sm:p-5 rounded-2xl border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${swipeAmount === amt
                      ? "bg-[#166534]/10 border-[#166534] text-ink shadow-sm"
                      : "bg-background border-border text-ink-muted hover:text-ink"
                      }`}
                  >
                    <span className="text-xl font-black block tabular-nums">
                      {formatCurrency(amt)}
                    </span>
                    <span className="text-[13px] font-medium text-ink-muted mt-1 block">
                      {amt === 5 ? "Standard" : amt === 3 ? "Light" : "Boost"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Balance & Preload Feature */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#166534]/10 border border-[#166534]/30 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#166534]/20 border border-[#166534]/40 flex items-center justify-center text-[#166534] shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-[#166534] tabular-nums">
                        {formatCurrency(donorPrefs.walletBalance)}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted">Available</span>
                    </div>
                    <span className="text-xs text-ink-muted block mt-0.5 leading-relaxed">
                      Preload allowance with Card or PayPal. Top-ups accumulate directly.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWalletRefillInitial(50);
                    setIsWalletModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-[13px] font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Fill up givi wallet</span>
                </button>
              </div>

              {/* Quick Top-Up Preset Pills */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#166534]/20">
                <span className="text-xs font-medium text-ink-muted shrink-0 hidden sm:inline">Add:</span>
                <button
                  type="button"
                  onClick={() => {
                    setWalletRefillInitial(25);
                    setIsWalletModalOpen(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-ink text-xs font-bold border border-border transition-colors cursor-pointer"
                >
                  +$25
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWalletRefillInitial(50);
                    setIsWalletModalOpen(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#166534]/20 hover:bg-[#166534]/30 text-[#166534] text-xs font-bold border border-[#166534]/40 transition-colors cursor-pointer"
                >
                  +$50
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWalletRefillInitial(100);
                    setIsWalletModalOpen(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-ink text-xs font-bold border border-border transition-colors cursor-pointer"
                >
                  +$100
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-14 h-14 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink flex items-center justify-center shrink-0 transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
              aria-label="Back to step 1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 h-14 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
            >
              <span>Continue to Identity</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-14 shrink-0 hidden sm:block pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Step 3: Impact Routing & Identity */}
      {step === 3 && !showGivingPass && (
        <div className="w-full max-w-xl flex flex-col my-auto motion-safe:animate-in fade-in duration-200">
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-2">
              Routing & identity
            </h1>
            <p className="text-sm text-ink-dim leading-relaxed">
              Configure your profile settings and choose how your community impact appears.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border shadow-card mb-8 flex flex-col gap-6">
            {/* Location & Routing Priority */}
            <div>
              <label className="text-sm font-bold text-ink block mb-3">
                Relief routing priority
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setImpactRadius("urgent")}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${
                    impactRadius === "urgent"
                      ? "bg-[#166534]/10 border-[#166534] text-ink ring-1 ring-[#166534] shadow-sm"
                      : "bg-surface-elevated border-border text-ink-muted hover:border-ink-muted"
                  }`}
                >
                  <Zap className="w-5 h-5 text-[#166534] mb-2.5" />
                  <span className="text-sm font-bold block text-ink">
                    Most urgent first
                  </span>
                  <span className="text-[13px] text-ink-muted block mt-1 leading-relaxed">
                    Imminent shutoff notices & copays
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImpactRadius("local")}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${
                    impactRadius === "local"
                      ? "bg-[#166534]/10 border-[#166534] text-ink ring-1 ring-[#166534] shadow-sm"
                      : "bg-surface-elevated border-border text-ink-muted hover:border-ink-muted"
                  }`}
                >
                  <MapPin className="w-5 h-5 text-[#166534] mb-2.5" />
                  <span className="text-sm font-bold block text-ink">
                    Local neighbors
                  </span>
                  <span className="text-[13px] text-ink-muted block mt-1 leading-relaxed">
                    Prioritize causes in my home state
                  </span>
                </button>
              </div>

              <div>
                <label className="text-[13px] font-medium text-ink-dim block mb-1.5">
                  Your City, State (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Austin, TX or Detroit, MI"
                  className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
                />
              </div>
            </div>

            {/* Privacy & Public Name */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-border flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-ink block">
                    Give anonymously
                  </span>
                  <span className="text-[13px] text-ink-muted block mt-0.5 leading-relaxed">
                    Mask your name on public community toasts
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 accent-[#166534] rounded cursor-pointer shrink-0"
                />
              </div>

              {!isAnonymous && (
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ink-muted block">Confirmed Donor Name</span>
                    <span className="text-sm font-bold text-ink flex items-center gap-1.5 mt-0.5">
                      <span>{displayName.trim() || "No name entered"}</span>
                      {restoredExistingAccount && (
                        <span className="text-[10px] font-bold text-[#166534] bg-[#166534]/15 px-2 py-0.2 rounded-full border border-[#166534]/30">
                          Restored
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated text-xs font-semibold text-[#166534] border border-border transition-colors cursor-pointer"
                  >
                    Edit in Step 1
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-14 h-14 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink flex items-center justify-center shrink-0 transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
              aria-label="Back to step 2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={!isAnonymous && !displayName.trim()}
              className="flex-1 h-14 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base shadow-sm flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
            >
              <span>Activate givi. Pass</span>
            </button>
            <div className="w-14 shrink-0 hidden sm:block pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* CLIMAX: Digital Giving Pass */}
      {showGivingPass && (
        <div
          ref={ticketContainerRef}
          className="w-full max-w-[530px] flex flex-col items-center motion-safe:animate-in zoom-in-95 duration-300"
        >
          <div className="text-center mb-6">
            <span className="text-xs sm:text-sm font-medium text-[#166534] block mb-1.5">
              {restoredExistingAccount
                ? `Welcome back, ${displayName.trim()} — ${formatCurrency(donorPrefs.walletBalance)} balance & giving history restored`
                : donorPrefs.walletBalance > 0
                ? `Pass activated — ${formatCurrency(donorPrefs.walletBalance)} giving allowance funded`
                : "Pass activated & verified"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Your givi. Pass
            </h2>
          </div>

          {/* Interactive WebGL Dithering Shader Ticket Card */}
          <div className="w-full flex justify-center mb-6 overflow-visible py-2">
            <AdmitOneTicket
              name={isAnonymous ? "Anonymous Giver" : displayName.trim() || "Givi Donor"}
              presenter="Givi Relief Pass"
              venue={location ? `${location} · ${formatCurrency(swipeAmount)} Swipe` : `Relief Hub · ${formatCurrency(swipeAmount)} Swipe`}
              dates={donorPrefs.walletBalance > 0 ? `${formatCurrency(donorPrefs.walletBalance)} Balance` : "givi. Wallet"}
              stubText={donorPrefs.walletBalance > 0 ? `Funded · ${formatCurrency(donorPrefs.walletBalance)}` : "Verified Donor"}
              watermark="2026"
              width={ticketWidth}
            />
          </div>

          {/* Pass Details Ribbon */}
          <div className="w-full rounded-2xl bg-surface border border-border p-4 sm:p-5 shadow-sm space-y-3.5 mb-8">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-xs text-ink-muted font-medium">Giving Allowance Pool</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#166534]">
                  {formatCurrency(donorPrefs.walletBalance)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setWalletRefillInitial(50);
                    setIsWalletModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#166534]/15 hover:bg-[#166534]/25 text-[#166534] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Add Funds</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-xs text-ink-muted font-medium">Priority Relief Sectors</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {selectedInterests.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-0.5 rounded-full bg-[#166534]/15 border border-[#166534]/30 text-[#166534] text-xs font-semibold uppercase"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-border-subtle flex items-center justify-between text-xs text-ink-muted">
              <div className="flex items-center gap-1.5 text-[#166534] font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>0% take rate guaranteed</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs text-ink-muted">
                <QrCode className="w-4 h-4" />
                <span>GV-2026-DONOR</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleLaunchFeed}
            className="w-full py-4 sm:py-4.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base sm:text-lg shadow-md flex items-center justify-center gap-2.5 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
          >
            <Heart className="w-5 h-5 fill-white" />
            <span>Enter swipe feed</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* Wallet Funding Modal */}
      <WalletFundingModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        initialAmount={walletRefillInitial}
        title="givi. Wallet"
        description="Every swipe in your feed will be deducted directly from this balance. Any amount you add will accumulate onto your existing allowance."
      />
    </div>
  );
}
