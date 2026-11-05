"use client";

import { useState } from "react";
import { Search, ShoppingCart, Check, ExternalLink, Loader2 } from "lucide-react";
import { Channel3Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface Channel3SearchProps {
  onSelectProduct: (product: Channel3Product) => void;
  selectedProductId?: string;
}

export function Channel3Search({ onSelectProduct, selectedProductId }: Channel3SearchProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Channel3Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const quickTags = ["Space Heater", "Infant Formula", "Warm Boots", "Glucose Strips", "Calculator"];

  const handleSearch = async (searchTerm: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/channel3/search?q=${encodeURIComponent(searchTerm)}`);
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
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4 text-[#118C4F]" />
          <span>Search Channel3 Catalog (100M+ Verified Retail Items)</span>
        </label>
        <span className="text-[10px] font-mono text-zinc-500">Zero Scraping · Real Merchant Pricing</span>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Search space heaters, formula, supplies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-[#1f1f23] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#118C4F]"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSearch(query)}
          disabled={isSearching}
          className="px-4 py-2.5 rounded-xl bg-[#118C4F] hover:bg-[#0e703f] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Quick Tags */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <span className="text-[11px] text-zinc-500">Popular:</span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              setQuery(tag);
              handleSearch(tag);
            }}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-[#1f1f23] transition-colors"
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
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#118C4F]/10 border-[#118C4F] text-white"
                    : "bg-black border-[#1f1f23] hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-14 h-14 rounded-lg object-cover bg-zinc-950 shrink-0 border border-[#1f1f23]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-zinc-900 text-zinc-400">
                      {p.merchant}
                    </span>
                    <a
                      href={p.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-500 hover:text-[#118C4F] p-0.5"
                      title="View on store"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">{p.title}</h4>
                  <div className="text-xs font-bold font-mono text-[#118C4F] mt-0.5">
                    {formatCurrency(p.price)}
                  </div>
                </div>

                <div className="shrink-0 pl-1">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#118C4F] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-zinc-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasSearched && products.length === 0 && !isSearching && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-[#1f1f23] text-center text-xs text-zinc-500">
          No matching products found in Channel3. Try searching &quot;heater&quot; or &quot;formula&quot;.
        </div>
      )}
    </div>
  );
}
