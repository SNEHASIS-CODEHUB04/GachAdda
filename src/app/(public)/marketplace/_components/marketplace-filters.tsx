"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  currentParams: {
    q?: string; category?: string; sort?: string;
    minPrice?: string; maxPrice?: string;
  };
  onClose?: () => void;
}

export default function MarketplaceFilters({ currentParams, onClose }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [minPrice, setMinPrice] = useState(currentParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(currentParams.maxPrice ?? "");

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(currentParams.q        ? { q: currentParams.q }                : {}),
      ...(currentParams.category ? { category: currentParams.category }  : {}),
      ...(currentParams.sort     ? { sort: currentParams.sort }          : {}),
      ...(currentParams.minPrice ? { minPrice: currentParams.minPrice }  : {}),
      ...(currentParams.maxPrice ? { maxPrice: currentParams.maxPrice }  : {}),
      ...overrides,
    });
    startTransition(() => {
      router.push(`/marketplace?${params.toString()}`);
      onClose?.();
    });
  }

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-primary-dark mb-3">Sort By</h3>
        <div className="flex flex-col gap-1.5">
          {[
            { value: "newest",     label: "Newest" },
            { value: "popular",    label: "Most Popular" },
            { value: "rating",     label: "Top Rated" },
            { value: "price_asc",  label: "Price: Low → High" },
            { value: "price_desc", label: "Price: High → Low" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => navigate({ sort: s.value, page: "1" })}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                (currentParams.sort ?? "newest") === s.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-primary-dark hover:bg-primary/5"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-primary-dark mb-3">Category</h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => navigate({ category: "", page: "1" })}
            className={cn(
              "text-left text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-2",
              !currentParams.category
                ? "bg-primary/10 text-primary font-semibold"
                : "text-primary-dark hover:bg-primary/5"
            )}
          >
            🌿 All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => navigate({ category: cat.slug, page: "1" })}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-2",
                currentParams.category === cat.slug
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-primary-dark hover:bg-primary/5"
              )}
            >
              <span aria-hidden="true">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-primary-dark mb-3">Price (₹)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            min={0}
            aria-label="Minimum price"
          />
          <span className="text-[var(--color-sage)]">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            min={0}
            aria-label="Maximum price"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => navigate({ minPrice, maxPrice, page: "1" })}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
