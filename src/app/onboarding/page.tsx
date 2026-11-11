"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Receipt, ShieldCheck, ArrowRight, Zap, Sparkles } from "lucide-react";
import { useUser, UserRole } from "@/lib/user-context";
import { AuthGate } from "@/components/ui/auth-gate";

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { setRole, role, isClerkSignedIn, demoPersona } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole>(role || "donor");

  const isJudgeMode = demoPersona === "judge_donor" || demoPersona === "judge_beneficiary";

  // Authenticated Clerk users bypass onboarding and go directly to their saved dashboard
  useEffect(() => {
    if (isClerkSignedIn && !isJudgeMode) {
      router.replace(role === "beneficiary" ? "/my-causes" : "/feed");
    }
  }, [isClerkSignedIn, isJudgeMode, role, router]);

  const handleContinue = (chosenRole: UserRole) => {
    setRole(chosenRole);
    if (chosenRole === "donor") {
      router.push("/onboarding/donor");
    } else {
      router.push("/onboarding/beneficiary");
    }
  };

  return (
    <AuthGate
      title="Welcome to Givi"
      description="Let's personalize your experience. How will you be using Givi today?"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full selection:bg-emerald-500/30">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 3 · Account Personalization</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight text-center mb-3">
          How do you want to participate?
        </h1>
        <p className="text-sm text-ink-muted text-center max-w-md mb-8 leading-relaxed">
          Choose your primary path. You can freely switch between donor and recipient views anytime from your header.
        </p>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
          {/* Option A: Donor */}
          <div
            onClick={() => setSelectedRole("donor")}
            className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === "donor"
                ? "bg-[#166534]/10 border-2 border-[#166534] shadow-sm"
                : "bg-surface border-border hover:border-border-subtle"
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#166534]/10 border border-[#166534]/30 flex items-center justify-center text-[#166534] mb-4">
                <Heart className="w-6 h-6 fill-current text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-ink mb-1.5">I want to donate</h2>
              <p className="text-xs text-ink-muted leading-relaxed mb-4">
                Swipe $5 micro-relief directly to overdue utility bills and urgent insulin copays with 0% platform fee.
              </p>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-semibold text-[#166534]">
              <span>Giving Pass setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Option B: Beneficiary */}
          <div
            onClick={() => setSelectedRole("beneficiary")}
            className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === "beneficiary"
                ? "bg-[#166534]/10 border-2 border-[#166534] shadow-sm"
                : "bg-surface border-border hover:border-border-subtle"
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#166534]/10 border border-[#166534]/30 flex items-center justify-center text-[#166534] mb-4">
                <Receipt className="w-6 h-6 text-[#166534]" />
              </div>
              <h2 className="text-lg font-bold text-ink mb-1.5">I need bill relief</h2>
              <p className="text-xs text-ink-muted leading-relaxed mb-4">
                Upload an overdue utility notice or prescription statement to receive direct community relief to your PayPal.
              </p>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-semibold text-[#166534]">
              <span>Payout wallet setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleContinue(selectedRole)}
          className="w-full py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm shadow-sm transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue as {selectedRole === "donor" ? "Donor" : "Relief Recipient"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Guarantee */}
        <div className="mt-6 flex items-center gap-1.5 text-xs text-ink-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
          <span>No fake data · 100% direct payouts via PayPal rail</span>
        </div>
      </div>
    </AuthGate>
  );
}
