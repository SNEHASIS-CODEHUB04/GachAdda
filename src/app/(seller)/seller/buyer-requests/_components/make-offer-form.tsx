"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface Props {
  requestId: string;
  buyerBudgetMax?: number | null;
}

export function MakeOfferForm({ requestId, buyerBudgetMax }: Props) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountAmt, setDiscountAmt] = useState("0");
  const [message, setMessage] = useState("");

  const orig = parseFloat(originalPrice) || 0;
  const disc = parseFloat(discountAmt) || 0;
  const finalPrice = Math.max(0, orig - disc);

  async function submit() {
    if (orig <= 0) { showError("Enter original price"); return; }
    setLoading(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        originalPrice: orig,
        discountAmt: disc,
        finalPrice,
        message: message.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { showError(data.error ?? "Failed"); return; }
    success("Offer sent to buyer ✅");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
        💰 Make an Offer
      </Button>
    );
  }

  return (
    <div className="border-t border-[var(--border)] pt-3 space-y-3">
      {buyerBudgetMax && (
        <p className="text-xs text-[var(--color-sage)] bg-cream/50 rounded-lg px-3 py-1.5">
          Buyer's max budget: <strong className="text-primary">{formatCurrency(buyerBudgetMax)}</strong>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-primary-dark mb-1">Your Price (₹) *</label>
          <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)}
            type="number" min="0" placeholder="500"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark mb-1">Discount (₹)</label>
          <input value={discountAmt} onChange={(e) => setDiscountAmt(e.target.value)}
            type="number" min="0" placeholder="0"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div className="bg-cream/50 rounded-lg px-3 py-2 flex justify-between text-sm font-semibold">
        <span className="text-[var(--color-sage)]">Buyer pays</span>
        <span className="text-primary text-base">{formatCurrency(finalPrice)}</span>
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to buyer (optional)..."
        rows={2}
        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={submit} loading={loading}>Send Offer</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
