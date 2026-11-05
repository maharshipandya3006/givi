"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProofUploader } from "./components/proof-uploader";
import { Channel3Search } from "./components/channel3-search";
import {
  FileText,
  ShoppingCart,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
} from "lucide-react";
import { CauseCategory, Channel3Product, NeedType, TrustScore } from "@/lib/types";

export default function CreateCausePage() {
  const router = useRouter();

  // Wizard state
  const [needType, setNeedType] = useState<NeedType>("bill");
  const [category, setCategory] = useState<CauseCategory>("utilities");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<string>("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverLocation, setReceiverLocation] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");

  // Attachments
  const [selectedProduct, setSelectedProduct] = useState<Channel3Product | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductSelect = (product: Channel3Product) => {
    setSelectedProduct(product);
    setTitle(product.title);
    setGoalAmount(product.price.toString());
  };

  const handleProofAnalysis = (result: {
    trustScore: TrustScore;
    extractedAmount?: number;
    extractedVendor?: string;
    imageBase64: string;
  }) => {
    setTrustScore(result.trustScore);
    setUploadedProofUrl(result.imageBase64);
    if (result.extractedAmount && !goalAmount) {
      setGoalAmount(result.extractedAmount.toString());
    }
    if (result.extractedVendor && !title) {
      setTitle(`${result.extractedVendor} Overdue Balance`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !goalAmount || !receiverEmail) {
      alert("Please fill in the title, amount, and PayPal payout email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        category,
        needType,
        goalAmount: parseFloat(goalAmount),
        receiverEmail,
        receiverName: receiverName || "Community Member",
        receiverLocation: receiverLocation || "Detroit, MI",
        evidenceUrls: uploadedProofUrl
          ? [uploadedProofUrl]
          : [
              "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
            ],
        redactedProofUrl: uploadedProofUrl,
        trustScore: trustScore || {
          overall: 90,
          tier: "high",
          factors: [
            { name: "Submission Verified", score: 90, status: "verified", details: "Direct user enrollment" },
          ],
          verifiedAt: new Date().toISOString(),
        },
        channel3Product: selectedProduct,
      };

      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/feed");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create cause");
      }
    } catch (err) {
      console.error("Create cause failed:", err);
      alert("Failed to submit cause. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sky-400 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Zero Platform Fee · 100% Direct Payouts</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Enroll a Need for Community Relief
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          Post an overdue bill, link an essential retail supply, or launch a community milestone project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Step 1: Need Type Selector */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">
            1. Select Need Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setNeedType("bill")}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                needType === "bill"
                  ? "bg-blue-500/10 border-blue-500 text-white"
                  : "bg-zinc-800/40 border-zinc-700/80 text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5 text-amber-400 mb-2" />
              <span className="text-xs font-bold text-zinc-200">Overdue Bill</span>
              <span className="text-[11px] text-zinc-400 mt-1">Utility, pharmacy, clinic, or rent</span>
            </button>

            <button
              type="button"
              onClick={() => setNeedType("aid_supply")}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                needType === "aid_supply"
                  ? "bg-blue-500/10 border-blue-500 text-white"
                  : "bg-zinc-800/40 border-zinc-700/80 text-zinc-400 hover:text-white"
              }`}
            >
              <ShoppingCart className="w-5 h-5 text-sky-400 mb-2" />
              <span className="text-xs font-bold text-zinc-200">Channel3 Retail Item</span>
              <span className="text-[11px] text-zinc-400 mt-1">Heater, formula, winter boots</span>
            </button>

            <button
              type="button"
              onClick={() => setNeedType("community")}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                needType === "community"
                  ? "bg-blue-500/10 border-blue-500 text-white"
                  : "bg-zinc-800/40 border-zinc-700/80 text-zinc-400 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5 text-purple-400 mb-2" />
              <span className="text-xs font-bold text-zinc-200">Community Cause</span>
              <span className="text-[11px] text-zinc-400 mt-1">Milestones & local mutual aid</span>
            </button>
          </div>
        </div>

        {/* Step 2: Verification Engine (Bill Upload vs Channel3 Search) */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">
            2. Verified Proof or Item Link
          </label>

          {needType === "bill" ? (
            <ProofUploader
              category={category}
              statedAmount={parseFloat(goalAmount || "100")}
              onAnalysisComplete={handleProofAnalysis}
            />
          ) : needType === "aid_supply" ? (
            <Channel3Search
              onSelectProduct={handleProductSelect}
              selectedProductId={selectedProduct?.id}
            />
          ) : (
            <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700 text-xs text-zinc-300">
              Community relief campaigns display interactive Bryntum milestone schedules for transparent
              phased fund releases.
            </div>
          )}
        </div>

        {/* Step 3: Details & PayPal Payout Destination */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            3. Beneficiary & PayPal Payout Details
          </label>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Cause Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DTE Energy Overdue Heat Bill"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CauseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-400"
              >
                <option value="utilities">⚡ Utilities</option>
                <option value="medical">💊 Medical</option>
                <option value="food">🍞 Groceries</option>
                <option value="education">🎒 Education</option>
                <option value="community">🤝 Community</option>
                <option value="climate">🌱 Climate</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Requested Goal ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="142.50"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white font-mono focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Beneficiary Name (Public)
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Sarah M."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Location (City, State)
              </label>
              <input
                type="text"
                value={receiverLocation}
                onChange={(e) => setReceiverLocation(e.target.value)}
                placeholder="e.g. Detroit, MI"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Beneficiary PayPal Email (For Instant Payouts)
            </label>
            <input
              type="email"
              required
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="beneficiary@sandbox.paypal.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white font-mono focus:outline-none focus:border-sky-400"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              100% of all micro-donations are transferred here immediately via PayPal Payouts API.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Short Backstory</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the urgent context so donors understand where their $5 goes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publishing Cause to Swipe Feed...
            </>
          ) : (
            <>
              <span>Publish to Active Swipe Feed</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
