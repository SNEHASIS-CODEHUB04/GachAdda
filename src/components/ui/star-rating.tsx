"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  max?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
  className?: string;
}

const sizeMap = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" };

export function StarRating({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = "md",
  showCount,
  count,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < display;
        return (
          <button
            key={i}
            type={readOnly ? "button" : "button"}
            disabled={readOnly}
            onClick={() => onChange?.(i + 1)}
            onMouseEnter={() => !readOnly && setHover(i + 1)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={cn(
              "transition-transform duration-100",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default pointer-events-none"
            )}
            aria-label={`${i + 1} star${i > 0 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled ? "fill-gold text-gold" : "text-gray-300 fill-gray-100"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
      {showCount && count !== undefined && (
        <span className="ml-1 text-sm text-[var(--color-sage)]">({count})</span>
      )}
    </div>
  );
}
