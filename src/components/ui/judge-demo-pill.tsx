"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CreditCard,
  Mail,
  Lock,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

export function JudgeDemoPill() {
  const router = useRouter();
  const {
    switchJudgePersona,
    setDonorOnboarded,
    setBeneficiaryOnboarded,
    updateDonorPrefs,
  } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRestartOnboarding = async (targetRole: "donor" | "beneficiary" = "donor") => {
    if (targetRole === "donor") {
      if (switchJudgePersona) switchJudgePersona("judge_donor");
      setDonorOnboarded(false);
      await updateDonorPrefs({ onboarded: false });
      router.push("/onboarding/donor");
    } else {
      if (switchJudgePersona) switchJudgePersona("judge_beneficiary");
      setBeneficiaryOnboarded(false);
      router.push("/onboarding/beneficiary");
    }
    setIsOpen(false);
  };

  return (
    <aside aria-label="Judge Sandbox Assistant" className="fixed bottom-20 md:bottom-4 right-4 z-40 flex flex-col items-end selection:bg-[#166534]/20">
      {/* Expanded Credential Panel */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl p-4 text-xs space-y-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Sparkles className="w-4 h-4 text-[#166534]" />
              <span>Judge & Demo Sandbox Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-muted hover:text-ink text-[11px] font-mono px-1.5 py-0.5 rounded hover:bg-surface-elevated"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed">
            Quick-copy credentials to test PayPal Sandbox checkout without typing.
          </p>

          {/* Donor Credentials */}
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
            {/* Donor Mail ID */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#166534]" />
                  Donor mail id
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard("gividonor@personal.example.com", "donor_email")
                  }
                  className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline"
                >
                  {copiedKey === "donor_email" ? (
                    <Check className="w-3 h-3 text-[#166534]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "donor_email" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5">
                gividonor@personal.example.com
              </code>
            </div>

            {/* Donor Password */}
            <div className="pt-1.5 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#166534]" />
                  Donor Password
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("gividonor1234", "donor_pw")}
                  className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline"
                >
                  {copiedKey === "donor_pw" ? (
                    <Check className="w-3 h-3 text-[#166534]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "donor_pw" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5">
                gividonor1234
              </code>
            </div>
          </div>

          {/* Test Sandbox Credit Card */}
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#166534]" />
                Sandbox Test Card
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard("4012888888881881", "card")}
                className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline"
              >
                {copiedKey === "card" ? (
                  <Check className="w-3 h-3 text-[#166534]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === "card" ? "Copied" : "Copy Card"}</span>
              </button>
            </div>
            <code className="text-[10px] font-mono text-ink-muted block">
              4012 8888 8888 1881 · Exp: 12/28 · CVV: 123
            </code>
          </div>

          {/* Beneficiary Credentials */}
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
            {/* Beneficiary Mail ID */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#166534]" />
                  Beneficiary mail id
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard("givibeneficiary@business.example.com", "bene_email")
                  }
                  className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === "bene_email" ? (
                    <Check className="w-3 h-3 text-[#166534]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "bene_email" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5">
                givibeneficiary@business.example.com
              </code>
            </div>

            {/* Beneficiary Password */}
            <div className="pt-1.5 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#166534]" />
                  Beneficiary Password
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("givibeneficiary1234", "bene_pw")}
                  className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === "bene_pw" ? (
                    <Check className="w-3 h-3 text-[#166534]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "bene_pw" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5">
                givibeneficiary1234
              </code>
            </div>
          </div>

          {/* Repeat Onboarding Triggers */}
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRestartOnboarding("donor")}
              className="flex-1 py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-ink font-bold text-[11px] border border-border flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-[#166534]" />
              <span>Onboard New Donor</span>
            </button>
            <button
              type="button"
              onClick={() => handleRestartOnboarding("beneficiary")}
              className="flex-1 py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-ink font-bold text-[11px] border border-border flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-[#166534]" />
              <span>Onboard Receiver</span>
            </button>
          </div>

          {/* Quick Actions Strip */}
          <div className="pt-2 border-t border-border flex flex-col gap-1.5">
            <Link
              href="/transparency"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#166534] dark:text-emerald-400 font-bold text-[11px] flex items-center justify-between transition-colors border border-emerald-500/20"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-[#166534]" />
                <span>View Live Transparency Ledger</span>
              </span>
              <span>→</span>
            </Link>

            <a
              href="https://sandbox.paypal.com"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight text-ink font-bold text-[11px] flex items-center justify-between transition-colors border border-border"
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#166534]" />
                <span>Verify on sandbox.paypal.com</span>
              </span>
              <span>↗</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-elevated/95 hover:bg-surface-highlight border border-border shadow-lg text-ink text-xs font-bold transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-[#166534]" />
        <span>Judge Demo Kit</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />}
      </button>
    </aside>
  );
}

