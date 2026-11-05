"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, ShieldCheck, Loader2, FileText } from "lucide-react";
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

export function ProofUploader({ onAnalysisComplete, category, statedAmount }: ProofUploaderProps) {
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
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Upload Overdue Bill or Receipt (Photo / PDF)</span>
        </label>
        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Auto-Redacted by Gemini
        </span>
      </div>

      {/* Upload Drop Area */}
      <label className="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-sky-500 bg-zinc-800/40 hover:bg-zinc-800/60 cursor-pointer transition-colors group">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        {previewUrl ? (
          <div className="flex items-center gap-4 w-full">
            <img
              src={previewUrl}
              alt="Uploaded statement"
              className="w-16 h-16 rounded-xl object-cover bg-zinc-900 border border-zinc-700"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-zinc-200 line-clamp-1">{fileName}</span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">Click to replace photo</span>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gemini OCR...
              </div>
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2 group-hover:text-sky-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-300">
              Drop bill image here or browse
            </span>
            <span className="text-[11px] text-zinc-500 mt-1">
              Supports JPG, PNG, WebP (Gas, Electric, Pharmacy, Medical)
            </span>
          </div>
        )}
      </label>

      {/* Real-time Gemini Verification Card */}
      {analysisResult && (
        <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-400">
                Gemini AI Trust Score: {analysisResult.score}%
              </span>
              {analysisResult.vendor && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {analysisResult.vendor}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">{analysisResult.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

