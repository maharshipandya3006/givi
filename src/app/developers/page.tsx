import Link from "next/link";
import { Code, Download, ExternalLink, Terminal, Shield, Zap } from "lucide-react";

export default function DevelopersPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/causes",
      description: "Returns active verified causes for the swipe deck filtered by category and trust score.",
      snippet: `curl -X GET "https://givi-web.onrender.com/api/causes?category=utilities"`,
    },
    {
      method: "POST",
      path: "/api/paypal/capture-and-payout",
      description: "Captures micro-donation and triggers instant direct PayPal Payout to recipient email.",
      snippet: `curl -X POST "https://givi-web.onrender.com/api/paypal/capture-and-payout" \\
  -H "Content-Type: application/json" \\
  -d '{"causeId": "cause-dte-heat-01", "amount": 5.00, "useDemoWallet": true}'`,
    },
    {
      method: "POST",
      path: "/api/agent/run",
      description: "Autonomous Agentic Commerce runner evaluating causes against policy rules.",
      snippet: `curl -X POST "https://givi-web.onrender.com/api/agent/run" \\
  -H "Content-Type: application/json" \\
  -d '{"maxAmountPerCause": 15.00, "minTrustScore": 85, "maxTotalBudget": 50.00}'`,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sky-400 text-xs font-semibold mb-2">
          <Code className="w-3.5 h-3.5" />
          <span>APIMatic Partner Developer Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Givi Developer Platform & OpenAPI Specs
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          Machine-readable API contracts enabling utilities, health clinics, and relief partners to
          integrate direct PayPal micro-payouts.
        </p>

        <div className="flex items-center justify-center gap-3 mt-4">
          <a
            href="/openapi.json"
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download OpenAPI 3.0 (JSON)
          </a>
          <a
            href="https://www.apimatic.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in APIMatic Studio
          </a>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="w-full space-y-4">
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md flex flex-col gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${
                  ep.method === "GET"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-500/20 text-sky-400 border border-blue-500/30"
                }`}
              >
                {ep.method}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-200">{ep.path}</span>
            </div>

            <p className="text-xs text-zinc-400">{ep.description}</p>

            <div className="relative p-3 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono mb-1.5">
                <Terminal className="w-3 h-3" />
                <span>Example Request</span>
              </div>
              <pre className="text-xs font-mono text-zinc-300 leading-relaxed">{ep.snippet}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
