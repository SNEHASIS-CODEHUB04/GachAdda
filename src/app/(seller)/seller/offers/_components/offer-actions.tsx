"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function OfferResponseActions({ offerId, status }: { offerId: string; status: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  if (status !== "PENDING" && status !== "COUNTERED") return null;

  async function act(action: "accept" | "reject" | "counter") {
    setLoading(action);
    const res = await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId,
        action,
        counterPrice: action === "counter" ? parseFloat(counterPrice) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) { showError(data.error ?? "Failed"); return; }
    success(action === "accept" ? "Offer accepted ✅" : action === "reject" ? "Offer rejected" : "Counter sent");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {showCounter ? (
        <>
          <input value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)}
            type="number" placeholder="₹ counter price"
            className="w-32 border border-[var(--border)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          <Button size="xs" loading={loading === "counter"} onClick={() => act("counter")}>Send Counter</Button>
          <Button size="xs" variant="ghost" onClick={() => setShowCounter(false)}>✕</Button>
        </>
      ) : (
        <>
          <Button size="xs" loading={loading === "accept"} onClick={() => act("accept")}>✅ Accept</Button>
          <Button size="xs" variant="outline" onClick={() => setShowCounter(true)}>↕ Counter</Button>
          <Button size="xs" variant="destructive" loading={loading === "reject"} onClick={() => act("reject")}>✕ Reject</Button>
        </>
      )}
    </div>
  );
}
