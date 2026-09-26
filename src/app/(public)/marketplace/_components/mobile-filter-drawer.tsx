"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import MarketplaceFilters from "./marketplace-filters";

interface Props {
  currentParams: {
    q?: string; category?: string; sort?: string;
    minPrice?: string; maxPrice?: string;
  };
}

export function MobileFilterDrawer({ currentParams }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button — shown only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[var(--border)] rounded-full text-sm font-medium text-primary-dark shadow-sm hover:border-primary/40 transition"
      >
        <SlidersHorizontal className="h-4 w-4 text-[var(--color-sage)]" />
        Filter & Sort
        {(currentParams.category || currentParams.sort || currentParams.minPrice || currentParams.maxPrice) && (
          <span className="h-2 w-2 rounded-full bg-primary ml-1" />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer sliding from bottom */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "85dvh", overflowY: "auto" }}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
          <h2 className="font-bold text-primary-dark text-base">Filter & Sort</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-full hover:bg-cream text-[var(--color-sage)] hover:text-primary-dark transition"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4 pb-24">
          <MarketplaceFilters currentParams={currentParams} onClose={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
