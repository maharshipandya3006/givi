"use client";

import { useState } from "react";
import { Search, ShoppingCart, Check, ExternalLink, Loader2 } from "lucide-react";
import { Channel3Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface Channel3SearchProps {
  onSelectProduct: (product: Channel3Product) => void;
  selectedProductId?: string;
}

export function Channel3Search({
  onSelectProduct,
  selectedProductId,
}: Channel3SearchProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Channel3Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const quickTags = [
    "Space Heater",
    "Infant Formula",
    "Winter Boots",
    "Glucose Test Strips",
    "Textbook",
  ];

  const handleSearch = async (searchTerm: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/channel3/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Channel3 search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col w-full text-left">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4 text-emerald-400" />
          <span>Search Channel3 Catalog (Verified Retail Supply Registry)</span>
        </label>
        <span className="text-[10px] font-mono text-zinc-400">
          25,000+ Merchants · Live Pricing
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-2.5 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Search space heaters, infant formula, supplies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-elevated border border-border text-xs text-ink placeholder-ink-dim focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSearch(query)}
          disabled={isSearching}
          className="px-5 py-2.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Quick Tags */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <span className="text-[11px] text-ink-muted font-medium">Popular:</span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              setQuery(tag);
              handleSearch(tag);
            }}
            className="text-[11px] px-3 py-1 rounded-full bg-surface-elevated hover:bg-surface-highlight text-ink-muted hover:text-ink border border-border transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Product Results Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
          {products.map((p) => {
            const isSelected = selectedProductId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#166534]/10 border-2 border-[#166534] text-ink shadow-sm"
                    : "bg-surface-elevated border-border hover:border-border-strong text-ink"
                }`}
              >
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-12 h-12 rounded-xl object-cover bg-surface border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-ink line-clamp-1 block">
                    {p.title}
                  </span>
                  <span className="text-[11px] text-ink-muted font-mono block mt-0.5">
                    {p.merchant} · {formatCurrency(p.price)}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#166534] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
