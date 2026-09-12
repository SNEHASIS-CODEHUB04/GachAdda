"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/constants";

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PAYMENT_VERIFIED: { status: "ORDER_ACCEPTED",  label: "Accept Order" },
  ORDER_ACCEPTED:   { status: "PROCESSING",      label: "Start Processing" },
  PROCESSING:       { status: "PACKED",          label: "Mark Packed" },
  PACKED:           { status: "DISPATCHED",      label: "Mark Dispatched" },
  DISPATCHED:       { status: "DELIVERED",       label: "Mark Delivered" },
};

interface Props {
  orderId: string;
  currentStatus: string;
}

export function SellerOrderActions({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const next = NEXT_STATUS[currentStatus as OrderStatus];
  if (!next) return null;

  async function advance() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next!.status, note: note.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { showError(data.error ?? "Failed"); return; }
    success(`Order marked as ${ORDER_STATUS_LABELS[next!.status]} ✅`);
    router.refresh();
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Next Action</p>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Note (optional) — e.g. tracking number`}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        />
      </div>
      <Button loading={loading} onClick={advance} size="sm">
        {next.label} →
      </Button>
    </div>
  );
}
