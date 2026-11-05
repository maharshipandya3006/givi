"use client";

import { useState, useEffect } from "react";
import { SwipeDeck } from "./components/swipe-deck";
import { Cause, CauseCategory } from "@/lib/types";
import { getActiveCauses } from "@/lib/causes-store";
import { Wallet, RefreshCw, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<CauseCategory | "all">("all");
  const [causes, setCauses] = useState<Cause[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(50.0);
  const [isLoading, setIsLoading] = useState(false);

  const categories: { id: CauseCategory | "all"; label: string }[] = [
    { id: "all", label: "All Needs" },
    { id: "utilities", label: "Utilities" },
    { id: "medical", label: "Medical" },
    { id: "food", label: "Groceries" },
    { id: "education", label: "Education" },
    { id: "community", label: "Community" },
    { id: "climate", label: "Climate" },
  ];

  // Fetch causes whenever category changes
  useEffect(() => {
    async function loadCauses() {
      setIsLoading(true);
      try {
        const url =
          selectedCategory === "all"
            ? "/api/causes"
            : `/api/causes?category=${selectedCategory}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCauses(data);
        } else {
          setCauses(getActiveCauses());
        }
      } catch (err) {
        console.warn("Could not fetch remote causes, using local store:", err);
        setCauses(getActiveCauses());
      } finally {
        setIsLoading(false);
      }
    }
    loadCauses();
  }, [selectedCategory]);

  const handleResetAllowance = () => {
    setWalletBalance(50.0);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 max-w-4xl mx-auto w-full">
      {/* Top Banner: Giving Allowance & Sandbox Status */}
      <div className="w-full max-w-md flex items-center justify-between p-3.5 px-4 rounded-2xl bg-zinc-950 border border-[#1f1f23] mb-6 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#118C4F]/10 text-[#118C4F] flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Giving Allowance</span>
            <span className="text-sm font-bold font-mono text-[#118C4F]">
              {formatCurrency(walletBalance)} Available
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAllowance}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs transition-colors border border-[#1f1f23]"
            title="Reset $50.00 Test Balance"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#118C4F]/10 text-[#118C4F] border border-[#118C4F]/30 flex items-center gap-1 font-semibold">
            <Zap className="w-3 h-3" />
            1-Click Swipes
          </span>
        </div>
      </div>

      {/* Category Pills Scroller */}
      <div className="w-full max-w-md flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? "bg-[#118C4F] text-white border-[#118C4F] shadow-md shadow-[#118C4F]/20"
                : "bg-zinc-950 text-zinc-400 border-[#1f1f23] hover:text-white hover:border-zinc-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Swipe Deck */}
      {isLoading ? (
        <div className="w-full h-[580px] max-w-[420px] rounded-3xl bg-zinc-950 border border-[#1f1f23] animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
          Loading verified causes...
        </div>
      ) : (
        <SwipeDeck
          initialCauses={causes}
          onDonationComplete={(newBalance) => setWalletBalance(newBalance)}
        />
      )}
    </div>
  );
}
