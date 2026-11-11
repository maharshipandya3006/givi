"use client";

import { Check, Tag } from "lucide-react";
import { CAUSE_CATEGORY_OPTIONS, CauseCategory } from "@/lib/types";

interface NeedCategoryTagsProps {
  category: CauseCategory;
  onCategoryChange: (cat: CauseCategory) => void;
  autoSaved?: boolean;
}

export function NeedCategoryTags({
  category,
  onCategoryChange,
  autoSaved = false,
}: NeedCategoryTagsProps) {
  return (
    <div className="mt-5 pt-5 border-t border-border text-left">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#166534]" />
          <span>Category</span>
        </span>
        {autoSaved && (
          <span className="text-[11px] text-[#166534] font-medium flex items-center gap-1">
            <Check className="w-3 h-3" />
            Auto-saved
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {CAUSE_CATEGORY_OPTIONS.map((opt) => {
          const active = category === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onCategoryChange(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? "bg-[#166534] text-white border-[#166534] shadow-xs"
                  : "bg-surface-elevated text-ink-muted border-border hover:text-ink hover:border-border-strong"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
