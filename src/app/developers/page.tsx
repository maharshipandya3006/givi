"use client";

import { useState, useEffect } from "react";
import { Download, ExternalLink, Terminal } from "lucide-react";

export default function DevelopersPage() {
  const [origin, setOrigin] = useState("http://localhost:3001");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const endpoints = [
    {
      method: "GET",
      path: "/api/causes",
      description:
        "Returns active verified causes for the swipe deck filtered by category and trust score.",
      snippet: `curl -X GET "${origin}/api/causes?category=utilities"`,
    },
    {
      method: "POST",
      path: "/api/paypal/capture-and-payout",
      description:
        "Captures micro-donation and triggers instant direct PayPal Payout to recipient email.",
      snippet: `curl -X POST "${origin}/api/paypal/capture-and-payout" \\
  -H "Content-Type: application/json" \\
  -d '{"causeId": "cause-dte-heat-01", "amount": 5.00, "useDemoWallet": true}'`,
    },
    {
      method: "POST",
      path: "/api/agent/run",
      description:
        "Autonomous Agentic Commerce runner evaluating causes against policy rules.",
      snippet: `curl -X POST "${origin}/api/agent/run" \\
  -H "Content-Type: application/json" \\
  -d '{"maxAmountPerCause": 15.00, "minTrustScore": 85, "maxTotalBudget": 50.00}'`,
    },
    {
      method: "POST",
      path: "/api/ai/analyze-document",
      description:
        "Google Gemini Vision OCR endpoint parsing utility statements, masking PII, and generating trust scores.",
      snippet: `curl -X POST "${origin}/api/ai/analyze-document" \\
  -H "Content-Type: application/json" \\
  -d '{"imageBase64": "...", "mimeType": "image/jpeg", "statedAmount": 142.50, "category": "utilities"}'`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-4xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Header (No Eyebrow/Kicker) */}
      <div className="text-center mb-10 max-w-xl">
        <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-2">
          Givi Developer Platform & OpenAPI Specs
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Machine-readable API contracts enabling utilities, health clinics, and relief partners to
          integrate direct PayPal micro-payouts and automated multimodal verification.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <a
            href="/openapi.json"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink text-xs font-bold border border-border transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-[#166534]" />
            <span>Download OpenAPI 3.0 (JSON)</span>
          </a>
          <a
            href="https://www.apimatic.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in APIMatic Studio</span>
          </a>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="w-full space-y-5">
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-surface border border-border shadow-card flex flex-col gap-3.5 hover:border-[#166534]/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#166534]/10 text-[#166534] border border-[#166534]/30">
                {ep.method}
              </span>
              <span className="font-mono text-xs font-bold text-ink">
                {ep.path}
              </span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              {ep.description}
            </p>

            <div className="relative p-4 rounded-2xl bg-surface-elevated border border-border overflow-x-auto">
              <div className="flex items-center gap-1.5 text-ink-dim text-[10px] font-mono mb-2">
                <Terminal className="w-3.5 h-3.5 text-[#166534]" />
                <span>Example cURL Request</span>
              </div>
              <pre className="text-xs font-mono text-ink leading-relaxed whitespace-pre-wrap">
                {ep.snippet}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
