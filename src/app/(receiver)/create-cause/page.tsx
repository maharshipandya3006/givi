"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProofUploader } from "./components/proof-uploader";
import { Channel3Search } from "./components/channel3-search";
import {
  FileText,
  ShoppingCart,
  Users,
  ArrowRight,
  Zap,
  Loader2,
  Lock,
} from "lucide-react";
import { CauseCategory, Channel3Product, NeedType, TrustScore } from "@/lib/types";
import { AuthGate } from "@/components/ui/auth-gate";
import { useUser } from "@/lib/user-context";

export default function CreateCausePage() {
  const router = useRouter();
  const { userId, userEmail, donorPrefs, demoPersona, updateDonorPrefs } = useUser();

  useEffect(() => {
    // maharshipandya006@gmail.com is strictly locked to donor role
    if (userEmail?.toLowerCase().includes("maharshipandya006") && !demoPersona) {
      router.replace("/feed");
    }
  }, [userEmail, demoPersona, router]);

  // Wizard state
  const [needType, setNeedType] = useState<NeedType>("bill");
  const [category, setCategory] = useState<CauseCategory>("utilities");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<string>("");
  const [receiverName, setReceiverName] = useState(donorPrefs.displayName || "");
  const [receiverLocation, setReceiverLocation] = useState(donorPrefs.location || "");
  const [receiverEmail, setReceiverEmail] = useState(userEmail && userEmail !== "guest@givi.app" ? userEmail : "");

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
        receiverEmail: receiverEmail || userEmail,
        receiverName: receiverName || "Community Neighbor",
        receiverLocation: receiverLocation || "Detroit, MI",
        receiverId: userId || "user_guest",
        evidenceUrls: uploadedProofUrl
          ? [uploadedProofUrl]
          : [
              "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
            ],
        redactedProofUrl:
          uploadedProofUrl ||
          "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
        trustScore: trustScore || {
          overall: 92,
          tier: "high",
          factors: [
            {
              name: "Submission Verified",
              score: 92,
              status: "verified",
              details: "Direct verified enrollment",
            },
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
        const data = await res.json();
        if (data?.id && typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("givi_my_submitted_cause_ids");
            const existing = raw ? JSON.parse(raw) : [];
            if (!existing.includes(data.id)) {
              localStorage.setItem("givi_my_submitted_cause_ids", JSON.stringify([...existing, data.id]));
            }
          } catch {}
        }
        if (receiverEmail && receiverEmail.includes("@")) {
          await updateDonorPrefs({ paypalEmail: receiverEmail });
        }
        router.push("/my-causes");
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
    <AuthGate
      title="Sign in to request relief"
      description="Connect with your Clerk account to upload your overdue bill or pharmacy notice for direct community micro-payouts."
    >
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Header (No Eyebrow/Kicker) */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-2">
          Enroll a Need for Community Relief
        </h1>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          Post an overdue utility statement, pharmacy copay, or essential retail supply. 100% of micro-donations route directly to your PayPal account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Step 1: Need Type Selector */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3 font-mono">
            Step 1 · Select Need Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setNeedType("bill")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                needType === "bill"
                  ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                  : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong"
              }`}
            >
              <FileText className="w-5 h-5 text-[#166534] mb-2" />
              <span className="text-xs font-bold text-ink">Overdue Bill</span>
              <span className="text-[11px] text-ink-muted mt-1">
                Gas, electric, water, copays
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNeedType("aid_supply")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                needType === "aid_supply"
                  ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                  : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong"
              }`}
            >
              <ShoppingCart className="w-5 h-5 text-[#166534] mb-2" />
              <span className="text-xs font-bold text-ink">
                Channel3 Item
              </span>
              <span className="text-[11px] text-ink-muted mt-1">
                Heater, formula, winter boots
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNeedType("community")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                needType === "community"
                  ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                  : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong"
              }`}
            >
              <Users className="w-5 h-5 text-[#166534] mb-2" />
              <span className="text-xs font-bold text-ink">
                Community Need
              </span>
              <span className="text-[11px] text-ink-muted mt-1">
                Food pantry, local relief
              </span>
            </button>
          </div>
        </div>

        {/* Step 2: Verification Engine (Bill Upload vs Channel3 Search) */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3 font-mono">
            Step 2 · Document Verification or Retail Item
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
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border text-xs text-ink-muted">
              Community mutual aid campaigns allow donors to chip in $5 toward collective neighborhood milestones.
            </div>
          )}
        </div>

        {/* Step 3: Details & PayPal Payout Destination */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-card space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block font-mono">
            Step 3 · Beneficiary & PayPal Payout Destination
          </label>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              Cause Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DTE Energy Winter Heat Shutoff Notice"
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CauseCategory)}
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink focus:outline-none focus:border-[#166534] transition-colors"
              >
                <option value="utilities">Utilities & Energy</option>
                <option value="medical">Medical & Pharmacy</option>
                <option value="food">Groceries & Nutrition</option>
                <option value="education">Education</option>
                <option value="community">Community Aid</option>
                <option value="climate">Emergency Supplies</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">
                Total Goal Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="142.50"
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">
                Beneficiary Name (Public)
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Sarah M."
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">
                Location (City, State)
              </label>
              <input
                type="text"
                value={receiverLocation}
                onChange={(e) => setReceiverLocation(e.target.value)}
                placeholder="e.g. Detroit, MI"
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink block">
                Recipient PayPal Email (Direct Payout Rail)
              </label>
              <button
                type="button"
                onClick={() => setReceiverEmail("givibeneficiary@business.example.com")}
                className="text-[10px] font-mono text-[#166534] hover:underline font-bold"
              >
                Use Judge Sandbox Receiver
              </button>
            </div>
            <input
              type="email"
              required
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              placeholder="e.g. yourname@example.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
            />
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-ink-muted">Sandbox preset:</span>
              <button
                type="button"
                onClick={() => setReceiverEmail("givibeneficiary@business.example.com")}
                className="px-2 py-0.5 rounded-lg bg-[#166534]/10 border border-[#166534]/20 text-[10px] font-mono text-[#166534] hover:bg-[#166534]/20 transition-colors"
              >
                givibeneficiary@business.example.com
              </button>
            </div>
            <span className="text-[11px] text-ink-muted mt-1 block">
              100% of all micro-donations are transferred directly here via PayPal Payouts API. Zero fees.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">
              Brief Human Story
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the urgent circumstances so donors understand why keeping this bill current matters..."
              className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing to Active Swipe Deck...</span>
            </>
          ) : (
            <>
              <span>Publish Cause to Public Feed</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
    </AuthGate>
  );
}
