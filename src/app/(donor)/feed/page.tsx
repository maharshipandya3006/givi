"use client";

import { useState, useEffect } from "react";
import { SwipeDeck } from "./components/swipe-deck";
import { Cause, CauseCategory } from "@/lib/types";
import { SEED_CAUSES } from "@/lib/seed-data";
import { Wallet, RefreshCw, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<CauseCategory | "all">("all");
  const [causes, setCauses] = useState<Cause[]>(SEED_CAUSES);
  const [walletBalance, setWalletBalance] = useState<number>(50.0);
  const [isLoading, setIsLoading] = useState(false);

  const categories: { id: CauseCategory | "all"; label: string; icon: string }[] = [
    { id: "all", label: "All Needs", icon: "✨" },
    { id: "utilities", label: "Utilities", icon: "⚡" },
    { id: "medical", label: "Medical", icon: "💊" },
    { id: "food", label: "Groceries", icon: "🍞" },
    { id: "education", label: "School", icon: "🎒" },
    { id: "community", label: "Community", icon: "🤝" },
    { id: "climate", label: "Climate", icon: "🌱" },
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
        }
      } catch (err) {
        console.warn("Could not fetch remote causes, using seed causes:", err);
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
      <div className="w-full max-w-md flex items-center justify-between p-3 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-mono text-zinc-400">Giving Allowance</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {formatCurrency(walletBalance)} Available
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAllowance}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
            title="Reset $50.00 Test Balance"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-sky-400 border border-blue-500/20 flex items-center gap-1">
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedCategory === cat.id
                ? "bg-white text-zinc-950 border-white shadow-md shadow-white/10"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Swipe Deck */}
      {isLoading ? (
        <div className="w-full h-[580px] max-w-[420px] rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse flex items-center justify-center text-zinc-500 text-sm">
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
