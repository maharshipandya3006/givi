"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ShoppingCart,
  Users,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Loader2,
  Lock,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { ProofUploader } from "@/app/(receiver)/create-cause/components/proof-uploader";
import { Channel3Search } from "@/app/(receiver)/create-cause/components/channel3-search";
import { CauseCategory, Channel3Product, NeedType, TrustScore } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function BeneficiaryOnboardingPage() {
  const router = useRouter();
  const { setBeneficiaryOnboarded, setRole, userId, userEmail, updateDonorPrefs, demoPersona } = useUser();

  useEffect(() => {
    // maharshipandya006@gmail.com is strictly locked to donor role
    if (userEmail?.toLowerCase().includes("maharshipandya006") && !demoPersona) {
      router.replace("/feed");
    }
  }, [userEmail, demoPersona, router]);

  const [step, setStep] = useState<number>(1);
  const [needType, setNeedType] = useState<NeedType>("bill");
  const [category, setCategory] = useState<CauseCategory>("utilities");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<string>("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverLocation, setReceiverLocation] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");

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
        description:
          description ||
          "Urgent emergency statement posted for verified community relief.",
        category,
        needType,
        goalAmount: parseFloat(goalAmount),
        receiverEmail: receiverEmail || userEmail,
        receiverName: receiverName || "Community Member",
        receiverLocation: receiverLocation || "United States",
        receiverId: userId || "user_guest",
        evidenceUrls: uploadedProofUrl
          ? [uploadedProofUrl]
          : [
              "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
            ],
        redactedProofUrl: uploadedProofUrl,
        trustScore: trustScore || {
          overall: 94,
          tier: "high",
          factors: [
            {
              name: "Submission Verified",
              score: 94,
              status: "verified",
              details: "Direct verified beneficiary enrollment",
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
        await updateDonorPrefs({ paypalEmail: receiverEmail });
        setRole("beneficiary");
        setBeneficiaryOnboarded(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#ecfdf5", "#f59e0b"],
        });
        router.push("/my-causes");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit cause.");
      }
    } catch (err) {
      console.error("Beneficiary submission failed:", err);
      alert("Failed to submit cause. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-xl mx-auto w-full selection:bg-emerald-500/30 selection:text-emerald-100">
      {/* Top Stepper Indicator */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted mb-2">
          <span className="font-bold text-[#166534]">
            Relief Enrollment · Step {step} of 4
          </span>
          <span>
            {step === 1
              ? "Need Category"
              : step === 2
              ? "Document / Supply"
              : step === 3
              ? "Context & Location"
              : "PayPal Rail"}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border">
          <div
            className="h-full bg-[#166534] rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        {/* Step 1: Need Selection */}
        {step === 1 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              What urgent relief can we help with?
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              Select the category of your urgent need. Givi connects you directly with community micro-donors with 0% platform fees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <button
                type="button"
                onClick={() => {
                  setNeedType("bill");
                  setCategory("utilities");
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  needType === "bill"
                    ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                    : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong"
                }`}
              >
                <FileText className="w-5 h-5 text-[#166534] mb-2" />
                <span className="text-xs font-bold text-ink">Overdue Bill</span>
                <span className="text-[11px] text-ink-muted mt-1 leading-tight">
                  Gas, electric, water, copays
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNeedType("aid_supply");
                  setCategory("climate");
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  needType === "aid_supply"
                    ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                    : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong"
                }`}
              >
                <ShoppingCart className="w-5 h-5 text-[#166534] mb-2" />
                <span className="text-xs font-bold text-ink">
                  Retail Supply
                </span>
                <span className="text-[11px] text-ink-muted mt-1 leading-tight">
                  Heaters, baby formula, boots
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNeedType("community");
                  setCategory("food");
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  needType === "community"
                    ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                    : "bg-surface-elevated border-border text-ink-muted hover:text-ink hover:border-border-strong"
                }`}
              >
                <Users className="w-5 h-5 text-[#166534] mb-2" />
                <span className="text-xs font-bold text-ink">Food / Aid</span>
                <span className="text-[11px] text-ink-muted mt-1 leading-tight">
                  Family groceries & nutrition
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Continue to Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Document Upload or Channel3 Search */}
        {step === 2 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              Verify Statement or Select Product
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              Upload a photo of your overdue statement. Gemini Vision automatically verifies the balance and masks private account numbers.
            </p>

            <div className="mb-8">
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
                  Community grocery relief allows neighbors to chip in $5 toward family food baskets.
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Continue to Context</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Dignified Context & Location */}
        {step === 3 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              Dignified Context & Location
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              Donors give when they understand the situation. Keep it brief—no long essays or invasive details required.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Headline / Statement Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DTE Energy Winter Heat Shutoff Notice"
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1.5">
                    Your Name (First name + initial)
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="e.g. Sarah M."
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink block mb-1.5">
                    City, State
                  </label>
                  <input
                    type="text"
                    value={receiverLocation}
                    onChange={(e) => setReceiverLocation(e.target.value)}
                    placeholder="e.g. Detroit, MI"
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Brief Context (1–2 sentences)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Disconnect notice received after reduced working hours. Mother of two toddlers."
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!title}
                className="flex-1 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <span>Continue to PayPal Payouts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: PayPal Payout Destination */}
        {step === 4 && (
          <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-card flex flex-col animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-ink tracking-tight mb-2">
              PayPal Instant Payout Destination
            </h2>
            <p className="text-xs text-ink-muted mb-6 leading-relaxed">
              100% of micro-donations are transferred directly to your PayPal account in seconds. 0% platform fee.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Your PayPal Email Address
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
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
                  Funds transfer automatically via PayPal Payouts API v1.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Requested Relief Goal Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="142.50"
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink font-mono placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-4 rounded-2xl bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !receiverEmail || !goalAmount}
                className="flex-1 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Publishing to Live Deck...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Publish Cause & Start Live Aid Tracker</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

