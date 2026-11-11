"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  MapPin,
  Heart,
  Filter,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { SEED_CAUSES } from "@/lib/seed-data";
import { Cause } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

export default function ExplorePage() {
  const router = useRouter();
  const { role, toggleBookmark, isBookmarked, donorPrefs } = useUser();

  useEffect(() => {
    if (role === "beneficiary") {
      router.replace("/my-causes");
    }
  }, [role, router]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [causes, setCauses] = useState<Cause[]>(() =>
    SEED_CAUSES.filter((c) => c.status !== "funded" && (c.goalAmount - c.raisedAmount) > 0.01)
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/causes?status=active");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCauses(data);
          } else {
            // Auto-replenish if all causes are funded so fresh cards are always loaded and ready
            setCauses(SEED_CAUSES.map((s) => ({ ...s, raisedAmount: 0.0, status: "active" as const })));
          }
        }
      } catch {
        // Fallback to initial seeds
      }
    }
    load();
  }, []);

  // When all causes are fulfilled, auto-replenish immediately so cards are always loaded and ready
  useEffect(() => {
    const activeRemaining = causes.filter(
      (c) => c.status !== "funded" && Math.round((c.goalAmount - c.raisedAmount) * 100) / 100 > 0.01
    );
    if (activeRemaining.length === 0 && SEED_CAUSES.length > 0) {
      setCauses(SEED_CAUSES.map((s) => ({ ...s, raisedAmount: 0.0, status: "active" as const })));
    }
  }, [causes]);

  const categories = [
    { id: "all", label: "All Needs" },
    { id: "utilities", label: "Heat & Electricity" },
    { id: "medical", label: "Prescriptions & Copays" },
    { id: "education", label: "School & Youth" },
    { id: "food", label: "Family Groceries" },
    { id: "climate", label: "Emergency Supplies" },
    { id: "community", label: "Infant & Family Care" },
    { id: "bookmarked", label: "Saved Needs" },
  ];

  const bookmarkedIds = donorPrefs?.bookmarkedCauseIds || [];

  const filteredCauses = useMemo(() => {
    return causes.filter((cause) => {
      // Do not keep 100% fulfilled causes in Explore
      const remaining = Math.round((cause.goalAmount - cause.raisedAmount) * 100) / 100;
      if (cause.status === "funded" || remaining <= 0.01) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const title = (cause.title || "").toLowerCase();
      const desc = (cause.description || "").toLowerCase();
      const loc = (cause.receiverLocation || "").toLowerCase();
      const receiver = (cause.receiverName || "").toLowerCase();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        desc.includes(q) ||
        loc.includes(q) ||
        receiver.includes(q);

      if (selectedCategory === "bookmarked") {
        return matchesSearch && (isBookmarked(cause.id) || bookmarkedIds.includes(cause.id));
      }

      const matchesCat =
        selectedCategory === "all" || cause.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [causes, searchQuery, selectedCategory, bookmarkedIds, isBookmarked]);

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto w-full selection:bg-[#166534]/20 selection:text-ink">
      {/* Header */}
      <div className="w-full mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight mb-2">
          Explore Verified Community Needs
        </h1>
        <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
          Browse urgent utility shutoff statements, prescription copays, and physical supplies. 100% of micro-donations disburse directly via PayPal with zero fees.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3 mb-8">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search providers (DTE Energy, Walgreens), cities, needs..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] shadow-sm transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? "bg-[#166534] text-white border-[#166534] shadow-sm"
                  : "bg-surface text-ink-muted border-border hover:text-ink hover:bg-surface-elevated"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {filteredCauses.length === 0 ? (
        <div className="w-full py-16 px-6 rounded-3xl bg-surface border border-border text-center flex flex-col items-center shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated text-ink-muted flex items-center justify-center mb-4 border border-border-subtle">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-ink mb-1">
            {selectedCategory === "bookmarked"
              ? "No Saved Needs Yet"
              : "No Needs Match Your Filters"}
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mb-6 leading-relaxed">
            {selectedCategory === "bookmarked"
              ? "Tap the bookmark icon on any cause card to save urgent bills and supplies for later review."
              : "Try clearing your search query or selecting a different category to see available relief requests."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
          >
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCauses.map((cause) => {
            const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);
            const percentage = Math.min(
              100,
              Math.round((cause.raisedAmount / cause.goalAmount) * 100)
            );
            const bookmarked = isBookmarked(cause.id);

            return (
              <div
                key={cause.id}
                className="rounded-3xl bg-surface border border-border shadow-card overflow-hidden flex flex-col justify-between hover:border-[#166534]/50 hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-surface-elevated text-ink-dim border border-border-subtle">
                      {cause.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#166534] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{cause.trustScore.overall}% Verified</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-ink mb-1.5 line-clamp-1">
                    {cause.title}
                  </h3>
                  <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed mb-4">
                    {cause.description}
                  </p>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black font-mono text-ink tabular-nums">
                      {formatCurrency(remaining)}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#166534]">
                      {percentage}% Funded
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-surface-elevated border border-border-subtle overflow-hidden">
                    <div
                      className="h-full bg-[#166534] rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 px-6 bg-surface-elevated/70 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
                    <MapPin className="w-3 h-3 text-[#166534]" />
                    <span>{cause.receiverLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(cause.id)}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        bookmarked
                          ? "bg-[#166534]/15 border-[#166534] text-[#166534]"
                          : "bg-surface border-border text-ink-muted hover:text-ink"
                      }`}
                      title={bookmarked ? "Remove bookmark" : "Bookmark cause"}
                      aria-label={bookmarked ? "Remove bookmark" : "Bookmark cause"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-[#166534]" : ""}`} />
                    </button>
                    <Link
                      href={`/feed?causeId=${encodeURIComponent(cause.id)}&category=${encodeURIComponent(cause.category)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Swipe ($5)</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
