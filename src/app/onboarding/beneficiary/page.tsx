"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Zap,
  Loader2,
  Mail,
  DollarSign,
  User,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { ProofUploader } from "@/app/(receiver)/create-cause/components/proof-uploader";
import { NeedCategoryTags } from "@/app/(receiver)/create-cause/components/need-category-tags";
import { CauseCategory, NeedType, TrustScore } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { useCauseSubmission } from "@/lib/use-cause-submission";
import confetti from "canvas-confetti";

const DRAFT_STORAGE_KEY = "givi_beneficiary_draft";

export default function BeneficiaryOnboardingPage() {
  const router = useRouter();
  const { setBeneficiaryOnboarded, setRole, userId, userEmail, updateDonorPrefs, demoPersona } = useUser();

  useEffect(() => {
    // maharshipandya006@gmail.com is strictly locked to donor role
    if (userEmail?.toLowerCase().includes("maharshipandya006") && !demoPersona) {
      router.replace("/feed");
    }
  }, [userEmail, demoPersona, router]);

  const [step, setStep] = useState<number>(1);

  // Issue 10: Shared cause submission hook
  const {
    category,
    setCategory,
    title,
    setTitle,
    description,
    setDescription,
    goalAmount,
    setGoalAmount,
    receiverName,
    setReceiverName,
    receiverLocation,
    setReceiverLocation,
    receiverEmail,
    setReceiverEmail,
    uploadedProofUrl,
    trustScore,
    handleProofAnalysis,
    submitCause,
    isSubmitting,
    autoSaved,
  } = useCauseSubmission({
    draftStorageKey: DRAFT_STORAGE_KEY,
    defaultEmail: userEmail && userEmail !== "guest@givi.app" ? userEmail : "",
    userId,
    onSuccess: async () => {
      if (receiverEmail && receiverEmail.includes("@")) {
        await updateDonorPrefs({ paypalEmail: receiverEmail });
      }
      setRole("beneficiary");
      setBeneficiaryOnboarded(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#ecfdf5", "#f59e0b"],
      });
      router.push("/my-causes");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    submitCause(e);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-xl mx-auto w-full selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* Top Stepper Indicator */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted mb-2">
          <span className="font-bold text-[#166534]">
            Relief Enrollment · Step {step} of 4
          </span>
          <span>
            {step === 1
              ? "Need Category"
              : step === 2
              ? "Upload Bill"
              : step === 3
              ? "Context & Location"
              : "PayPal Rail"}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border">
          <div
            className="h-full bg-[#166534] rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        {/* Step 1: Need Selection */}
        {step === 1 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              What urgent relief can we help with?
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              Select the category of your urgent need. Givi connects you directly with community micro-donors with 0% platform fees.
            </p>

            <div className="flex justify-center mb-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full max-w-xs p-5 rounded-2xl border-2 border-[#166534] bg-[#166534]/10 text-ink shadow-sm text-left transition-all flex flex-col justify-between"
              >
                <FileText className="w-5 h-5 text-[#166534] mb-2" />
                <span className="text-sm font-bold text-ink">Submit Bill</span>
                <span className="text-[11px] text-ink-muted mt-1 leading-tight">
                  Gas, electric, water, copays
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Continue to Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Bill Upload & Category Tags */}
        {step === 2 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              Submit Bill
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              Upload a photo of your overdue statement.
            </p>

            <div className="mb-8">
              <ProofUploader
                category={category}
                statedAmount={parseFloat(goalAmount || "100")}
                onAnalysisComplete={handleProofAnalysis}
              />
              <NeedCategoryTags
                category={category}
                onCategoryChange={setCategory}
                autoSaved={autoSaved}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Continue to Context</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Dignified Context & Location */}
        {step === 3 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              Dignified Context & Location
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              Donors give when they understand the situation. Keep it brief—no long essays or invasive details required.
            </p>

            <div className="space-y-4 mb-8">
              <div className="relative">
                <FileText className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Statement Title"
                  aria-label="Statement Title"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Your Name"
                    aria-label="Your Name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                  />
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={receiverLocation}
                    onChange={(e) => setReceiverLocation(e.target.value)}
                    placeholder="City, State"
                    aria-label="City, State"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                  />
                </div>
              </div>

              <div className="relative">
                <MessageSquare className="w-4 h-4 text-ink-muted absolute left-3.5 top-3 pointer-events-none" />
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief Context (1–2 sentences)"
                  aria-label="Brief Context (1–2 sentences)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!title}
                className="flex-1 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <span>Continue to PayPal Payouts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: PayPal Payout Destination */}
        {step === 4 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              PayPal Instant Payout Destination
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              100% of micro-donations are transferred directly to your PayPal account in seconds. 0% platform fee.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Your PayPal Email Address
                  </label>
                  <button
                    type="button"
                    onClick={() => setReceiverEmail("givibeneficiary@business.example.com")}
                    className="text-[10px] font-mono text-[#166534] hover:underline font-bold"
                  >
                    Use Judge Sandbox Receiver
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    aria-label="Your PayPal Email Address"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Requested Relief Goal Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    aria-label="Requested Relief Goal Amount"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !receiverEmail || !goalAmount}
                className="flex-1 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Publishing to Live Deck...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Publish Cause & Start Live Aid Tracker</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

