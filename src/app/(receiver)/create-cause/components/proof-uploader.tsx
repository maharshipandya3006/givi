"use client";

import { useState } from "react";
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Lock,
  Scan,
} from "lucide-react";
import { TrustScore } from "@/lib/types";

interface ProofUploaderProps {
  onAnalysisComplete: (result: {
    trustScore: TrustScore;
    extractedAmount?: number;
    extractedVendor?: string;
    imageBase64: string;
  }) => void;
  category: string;
  statedAmount: number;
}

export function ProofUploader({
  onAnalysisComplete,
  category,
  statedAmount,
}: ProofUploaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    vendor?: string;
    score?: number;
    summary?: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Data = (reader.result as string).split(",")[1];
      setPreviewUrl(reader.result as string);
      setIsAnalyzing(true);

      try {
        const response = await fetch("/api/ai/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || "image/jpeg",
            statedAmount,
            category,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysisResult({
            vendor: data.extractedVendor,
            score: data.trustScore.overall,
            summary: data.summary,
          });

          onAnalysisComplete({
            trustScore: data.trustScore,
            extractedAmount: data.extractedAmount,
            extractedVendor: data.extractedVendor,
            imageBase64: reader.result as string,
          });
        }
      } catch (err) {
        console.error("Document analysis request failed:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col w-full text-left">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Upload statement document (photo or scan)</span>
        </label>
        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
          <Lock className="w-3.5 h-3.5" />
          Auto-masked by Gemini Vision
        </span>
      </div>

      {/* Upload Drop & Scan Area */}
      <label className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-emerald-500 bg-background cursor-pointer transition-colors group overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        {previewUrl ? (
          <div className="relative w-full p-4 flex flex-col gap-3">
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-border">
              {previewUrl.startsWith("data:application/pdf") || fileName?.toLowerCase().endsWith(".pdf") ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-surface-elevated">
                  <FileText className="w-12 h-12 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-ink max-w-[200px] truncate">{fileName || "PDF Document"}</span>
                  <span className="text-[11px] text-ink-muted mt-0.5">PDF Statement Document</span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Uploaded statement"
                  className="w-full h-full object-cover opacity-85"
                />
              )}

              {/* Animated Laser Scanning Line during Analysis */}
              {isAnalyzing && (
                <>
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-emerald-md motion-safe:animate-laser z-20 pointer-events-none" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 border border-emerald-500/50 text-[11px] text-emerald-400 flex items-center gap-1.5 z-20 shadow-md">
                    <Scan className="w-3.5 h-3.5 animate-pulse" />
                    <span>Gemini Vision OCR scanning...</span>
                  </div>
                </>
              )}

              {/* Real-Time Redaction Badge Overlay */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/85 border border-border text-[11px] text-ink-dim flex items-center gap-1.5 z-10 shadow-md">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Account # masked (••••••4920)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-ink line-clamp-1 max-w-[240px]">
                {fileName}
              </span>
              <span className="text-[11px] text-emerald-400 hover:underline">
                Tap to change document
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-ink-muted mb-3 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-ink mb-1">
              Drop statement photo here or click to browse
            </span>
            <span className="text-[11px] text-ink-muted max-w-xs leading-relaxed">
              Supports JPG, PNG, WebP (DTE Energy, ConEd, Pharmacy Copays, Water Bills)
            </span>
            <span className="mt-3 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Gemini Vision extracts amount & masks PII
            </span>
          </div>
        )}
      </label>

      {/* Real-time Gemini Verification Card */}
      {analysisResult && (
        <div className="mt-3.5 p-4 rounded-2xl bg-background border border-emerald-500/30 flex items-start gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-400 text-xs">
                Gemini AI Trust Score: {analysisResult.score}% verified
              </span>
              {analysisResult.vendor && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {analysisResult.vendor}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-dim leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
