"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface Props {
  id: string;
  askPrice: number;
  originalPrice: number;
}

export function DiscountActions({ id, askPrice, originalPrice }: Props) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [counter, setCounter] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  async function act(action: "accept" | "reject" | "counter") {
    const counterVal = parseFloat(counter);
    if (action === "counter" && (!counter || counterVal <= 0 || counterVal >= originalPrice)) {
      showError(`Counter price must be between ₹1 and ₹${originalPrice}`);
      return;
    }
    setLoading(action);
    const res = await fetch("/api/discount-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action,
        finalPrice:   action === "accept" ? askPrice : undefined,
        counterPrice: action === "counter" ? counterVal : undefined,
      }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) { showError(data.error ?? "Failed"); return; }
    success(
      action === "accept" ? `Discount accepted at ${formatCurrency(askPrice)} ✅` :
      action === "reject" ? "Discount rejected" :
      `Counter offer of ${formatCurrency(counterVal)} sent`
    );
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <Button size="xs" loading={loading === "accept"} disabled={loading !== null} onClick={() => act("accept")}>
        ✅ Accept {formatCurrency(askPrice)}
      </Button>
      {!showCounter ? (
        <Button size="xs" variant="outline" disabled={loading !== null} onClick={() => setShowCounter(true)}>
          ↕ Counter
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            type="number" min="1" placeholder="₹ your price"
            className="w-28 border border-[var(--border)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="xs" loading={loading === "counter"} disabled={loading !== null} onClick={() => act("counter")}>Send</Button>
          <Button size="xs" variant="ghost" onClick={() => setShowCounter(false)}>✕</Button>
        </div>
      )}
      <Button size="xs" variant="destructive" loading={loading === "reject"} disabled={loading !== null} onClick={() => act("reject")}>
        ✕ Reject
      </Button>
    </div>
  );
}
