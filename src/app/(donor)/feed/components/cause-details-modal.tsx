"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Lock,
  FileText,
} from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CauseDetailsModalProps {
  cause: Cause | null;
  onClose: () => void;
  onDonate?: (amount: number) => void;
}

export function CauseDetailsModal({
  cause,
  onClose,
  onDonate,
}: CauseDetailsModalProps) {
  if (!cause) return null;

  const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);
  const percentage = Math.min(
    100,
    Math.round((cause.raisedAmount / cause.goalAmount) * 100)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-50 max-w-xl w-full max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-3xl p-6 text-ink shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {cause.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-muted font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {cause.receiverLocation}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Story */}
          <div className="py-5">
            <h2 className="text-xl font-bold text-ink mb-2 leading-tight">
              {cause.title}
            </h2>
            <p className="text-sm text-ink-dim leading-relaxed mb-6">
              {cause.description}
            </p>

            {/* Verified Document Proof Window */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
                <span className="font-semibold text-ink">
                  Redacted statement proof
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  PII masked
                </span>
              </div>
              <div className="rounded-2xl border border-border overflow-hidden bg-black max-h-64 flex items-center justify-center p-2">
                {(cause.redactedProofUrl || cause.evidenceUrls[0] || "").toLowerCase().includes(".pdf") ||
                (cause.redactedProofUrl || cause.evidenceUrls[0] || "").startsWith("data:application/pdf") ? (
                  <div className="flex flex-col items-center justify-center text-ink gap-2 py-8">
                    <FileText className="w-12 h-12 text-emerald-400" />
                    <span className="text-xs font-mono font-bold">{cause.title} Statement</span>
                    <a
                      href={cause.redactedProofUrl || cause.evidenceUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:underline font-semibold"
                    >
                      View statement document
                    </a>
                  </div>
                ) : (
                  <img
                    src={
                      cause.redactedProofUrl ||
                      cause.channel3Product?.imageUrl ||
                      cause.evidenceUrls[0]
                    }
                    alt="Proof statement"
                    className="w-full h-full object-contain max-h-64"
                  />
                )}
              </div>
            </div>

            {/* Gemini AI Trust Score Audit Factors */}
            <div className="p-4 rounded-2xl bg-background border border-border mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-ink">
                    Gemini Vision AI audit
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {cause.trustScore.overall}% verified
                </span>
              </div>

              <div className="space-y-2">
                {cause.trustScore.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between text-xs py-1.5 border-t border-border-subtle first:border-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">
                        {factor.name}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {factor.details}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-ink-muted font-semibold">
                        {factor.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Progress & Close Buttons */}
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-ink tabular-nums">
                    {formatCurrency(remaining)}
                  </span>
                  <span className="text-xs text-ink-muted">
                    needed to clear bill
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {percentage}% funded
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <button
                onClick={onClose}
                className="w-full mt-2 py-3.5 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Close inspection
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
