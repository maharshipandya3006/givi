"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProofUploader } from "./components/proof-uploader";
import { NeedCategoryTags } from "./components/need-category-tags";
import {
  FileText,
  ArrowRight,
  Loader2,
  Mail,
  DollarSign,
  User,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { CauseCategory, NeedType, TrustScore } from "@/lib/types";
import { AuthGate } from "@/components/ui/auth-gate";
import { useUser } from "@/lib/user-context";
import { useCauseSubmission } from "@/lib/use-cause-submission";

const CREATE_CAUSE_DRAFT_KEY = "givi_create_cause_draft";

export default function CreateCausePage() {
  const router = useRouter();
  const { userId, userEmail, donorPrefs, demoPersona, updateDonorPrefs } = useUser();

  useEffect(() => {
    // maharshipandya006@gmail.com is strictly locked to donor role
    if (userEmail?.toLowerCase().includes("maharshipandya006") && !demoPersona) {
      router.replace("/feed");
    }
  }, [userEmail, demoPersona, router]);

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
    draftStorageKey: CREATE_CAUSE_DRAFT_KEY,
    defaultEmail: userEmail && userEmail !== "guest@givi.app" ? userEmail : "",
    defaultName: donorPrefs.displayName || "",
    defaultLocation: donorPrefs.location || "",
    userId,
    onSuccess: async () => {
      if (receiverEmail && receiverEmail.includes("@")) {
        await updateDonorPrefs({ paypalEmail: receiverEmail });
      }
      router.push("/my-causes");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    submitCause(e);
  };

  return (
    <AuthGate
      title="Sign in to request relief"
      description="Connect with your Clerk account to upload your overdue bill or pharmacy notice for direct community micro-payouts."
    >
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Header (No Eyebrow/Kicker) */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-2">
          Enroll a Need for Community Relief
        </h1>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          Post an overdue utility statement or pharmacy copay. 100% of micro-donations route directly to your PayPal account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Step 1: Need Type Selector */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3 font-mono">
            Step 1 · Select Need Category
          </label>
          <div className="flex justify-center">
            <div className="w-full max-w-xs p-4 rounded-2xl border-2 border-[#166534] bg-[#166534]/10 text-ink shadow-sm text-left flex flex-col justify-between">
              <FileText className="w-5 h-5 text-[#166534] mb-2" />
              <span className="text-xs font-bold text-ink">Submit Bill</span>
              <span className="text-[11px] text-ink-muted mt-1">
                Gas, electric, water, copays
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Bill Upload & Category Tags */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3 font-mono">
            Step 2 · Submit Bill
          </label>

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

        {/* Step 3: Details & PayPal Payout Destination */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block font-mono">
            Step 3 · Beneficiary & PayPal Payout Destination
          </label>

          <div className="relative">
            <FileText className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Statement Title"
              aria-label="Statement Title"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] transition-colors"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] transition-colors"
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
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors leading-relaxed"
            />
          </div>

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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing to Active Swipe Deck...</span>
            </>
          ) : (
            <>
              <span>Publish Cause to Public Feed</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
    </AuthGate>
  );
}
