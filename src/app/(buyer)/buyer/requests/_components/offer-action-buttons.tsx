"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function OfferActionButtons({ offerId }: { offerId: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  async function act(action: "accept" | "reject") {
    setLoading(action);
    const res = await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, action }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) { showError(data.error ?? "Failed"); return; }
    success(action === "accept" ? "Offer accepted! 🌿 Suman will prepare your order." : "Offer declined.");
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      <Button size="xs" loading={loading === "accept"} disabled={loading !== null} onClick={() => act("accept")}>Accept</Button>
      <Button size="xs" variant="outline" loading={loading === "reject"} disabled={loading !== null} onClick={() => act("reject")}>Decline</Button>
    </div>
  );
}
