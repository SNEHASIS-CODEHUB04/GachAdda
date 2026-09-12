"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function PaymentVerifyActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);
  const [checked, setChecked] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleAction(action: "verify" | "reject") {
    setLoading(action);
    const res = await fetch(`/api/payments/${paymentId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectReason: action === "reject" ? rejectReason : undefined }),
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { showError(json.error ?? "Action failed"); return; }
    success(action === "verify" ? "Payment verified ✅ — Invoice generated!" : "Payment rejected");
    router.refresh();
  }

  return (
    <div className="border-t border-[var(--border)] pt-4 space-y-4">

      {/* Horizontal checkbox confirmation row */}
      <div className="flex flex-wrap items-center gap-4 bg-cream/50 rounded-xl px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setChecked((v) => !v)}
            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              checked ? "bg-success border-success" : "border-[var(--border)] bg-white"
            }`}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => e.key === " " && setChecked((v) => !v)}
          >
            {checked && (
              <svg viewBox="0 0 12 10" className="h-3 w-3 text-white fill-none stroke-current stroke-2">
                <polyline points="1,5 4,9 11,1" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-primary-dark">
            I have confirmed the payment in my PhonePe account
          </span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle className="h-4 w-4" />}
            loading={loading === "verify"}
            disabled={!checked || loading !== null}
            onClick={() => handleAction("verify")}
          >
            Verify & Accept
          </Button>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<XCircle className="h-4 w-4" />}
            disabled={loading !== null}
            onClick={() => setShowRejectConfirm((v) => !v)}
          >
            Reject
          </Button>
        </div>
      </div>

      {/* Reject reason */}
      {showRejectConfirm && (
        <div className="flex gap-2 items-start">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (e.g. wrong UTR, amount mismatch)"
            className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-error"
          />
          <Button
            variant="destructive"
            size="sm"
            loading={loading === "reject"}
            disabled={!rejectReason.trim() || loading !== null}
            onClick={() => handleAction("reject")}
          >
            Confirm Reject
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowRejectConfirm(false); setRejectReason(""); }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
