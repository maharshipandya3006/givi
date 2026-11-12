"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  Lock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function PayPalSandboxPill() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <aside
      aria-label="PayPal Sandbox Credentials"
      className="fixed bottom-20 md:bottom-4 right-4 z-40 flex flex-col items-end selection:bg-[#166534]/20"
    >
      {/* Expanded Credential Panel */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl p-4 text-xs space-y-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
              <span>PayPal Sandbox Test Accounts</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-ink-muted hover:text-ink text-[11px] font-mono px-1.5 py-0.5 rounded hover:bg-surface-elevated cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-ink-muted leading-relaxed">
            Use these credentials inside the PayPal Sandbox popup window to test donor checkout and receiver payouts without typing.
          </p>

          {/* Sandbox Buyer Credentials */}
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border space-y-2">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              PayPal Sandbox Buyer Login (Donor)
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#166534]" />
                  Buyer Email
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("gividonor@personal.example.com", "buyer_email")}
                  className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === "buyer_email" ? (
                    <Check className="w-3 h-3 text-[#166534]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "buyer_email" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5 select-all">
                gividonor@personal.example.com
              </code>
            </div>

            <div className="pt-1.5 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#166534]" />
                  Buyer Password
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("gividonor1234", "buyer_pw")}
                  className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === "buyer_pw" ? (
                    <Check className="w-3 h-3 text-[#166534]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "buyer_pw" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5 select-all">
                gividonor1234
              </code>
            </div>
          </div>

          {/* Sandbox Test Card */}
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#166534]" />
                Sandbox Test Card (Guest Checkout)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard("4012888888881881", "card_num")}
                className="flex items-center gap-1 text-[10px] text-[#166534] font-bold hover:underline cursor-pointer"
              >
                {copiedKey === "card_num" ? (
                  <Check className="w-3 h-3 text-[#166534]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === "card_num" ? "Copied" : "Copy Card"}</span>
              </button>
            </div>
            <code className="text-[10px] font-mono text-ink-muted block mt-1 select-all">
              4012 8888 8888 1881 · Exp: 12/28 · CVV: 123
            </code>
          </div>

          {/* Sandbox Receiver / Merchant Account */}
          <div className="p-2.5 rounded-xl bg-surface-elevated border border-border space-y-2">
            <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              PayPal Sandbox Receiver Account (Merchant)
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Receiver Email (Payouts Destination)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("givibeneficiary@business.example.com", "receiver_email")}
                  className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === "receiver_email" ? (
                    <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "receiver_email" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5 select-all">
                givibeneficiary@business.example.com
              </code>
            </div>

            <div className="pt-1.5 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-[11px] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Receiver Password
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("givibeneficiary1234", "receiver_pw")}
                  className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  {copiedKey === "receiver_pw" ? (
                    <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === "receiver_pw" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="text-[10px] font-mono text-ink-muted block truncate mt-0.5 select-all">
                givibeneficiary1234
              </code>
            </div>
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
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-elevated/95 hover:bg-surface-highlight border border-border shadow-lg text-ink text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4 text-[#166534]" />
        <span>PayPal Sandbox Credentials</span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
        )}
      </button>
    </aside>
  );
}

