"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CauseDetailsModalProps {
  cause: Cause | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CauseDetailsModal({ cause, isOpen, onClose }: CauseDetailsModalProps) {
  if (!cause) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-xl w-full max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-sky-400 border border-blue-500/20">
                  {cause.category.toUpperCase()}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  {cause.receiverLocation}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <h2 className="text-xl font-bold text-zinc-100 mb-2">{cause.title}</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">{cause.description}</p>

              {/* Verified Proof Document Crop */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-semibold text-zinc-200">Redacted Statement Proof:</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sensitive Info Masked
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 aspect-video flex items-center justify-center">
                  <img
                    src={cause.redactedProofUrl || cause.evidenceUrls[0]}
                    alt="Proof statement"
                    className="object-cover w-full h-full opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-[11px] font-mono text-zinc-300">
                      Private account # and home address masked for beneficiary dignity.
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemini AI Trust Score Breakdown */}
              <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Gemini AI Trust Score
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {cause.trustScore.overall}% Verified
                  </span>
                </div>

                <div className="space-y-2">
                  {cause.trustScore.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        {factor.status === "verified" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span>{factor.name}</span>
                      </div>
                      <span className="text-zinc-400 text-[11px] text-right font-mono">
                        {factor.details}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800 text-center">
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-mono">Total Overdue</div>
                  <div className="text-lg font-bold font-mono text-white">
                    {formatCurrency(cause.goalAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase font-mono">Community Covered</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {formatCurrency(cause.raisedAmount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
              >
                Close Evidence
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
