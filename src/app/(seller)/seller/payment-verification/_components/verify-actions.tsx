"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function PaymentVerifyActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);
  const [checked, setChecked] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
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
    success(action === "verify" ? "Payment verified ✅ — Invoice generated!" : "Payment rejected ❌");
    router.refresh();
  }

  return (
    <div className="border-t border-gray-200 pt-4 space-y-3">

      {/* Checkbox row */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
        {/* Custom checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => setChecked((v) => !v)}
          className="shrink-0 focus:outline-none"
        >
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            border: checked ? "2px solid #22c55e" : "2px solid #d1d5db",
            backgroundColor: checked ? "#22c55e" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}>
            {checked && (
              <svg viewBox="0 0 12 10" width="13" height="11" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1,5 4,9 11,1" />
              </svg>
            )}
          </div>
        </button>

        <span
          className="text-sm font-medium text-gray-800 cursor-pointer select-none flex-1"
          onClick={() => setChecked((v) => !v)}
        >
          I have confirmed the payment in my PhonePe account
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            disabled={!checked || loading !== null}
            onClick={() => handleAction("verify")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: (!checked || loading !== null) ? "#d1d5db" : "#16a34a",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: (!checked || loading !== null) ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            {loading === "verify" ? "Verifying…" : "Verify & Accept"}
          </button>

          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setShowRejectInput((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: loading !== null ? "#d1d5db" : "#dc2626",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: loading !== null ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject
          </button>
        </div>
      </div>

      {/* Reject reason input */}
      {showRejectInput && (
        <div className="flex gap-2 items-center">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (e.g. wrong UTR, amount mismatch)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            disabled={!rejectReason.trim() || loading !== null}
            onClick={() => handleAction("reject")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: !rejectReason.trim() || loading !== null ? "#d1d5db" : "#dc2626",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: !rejectReason.trim() || loading !== null ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading === "reject" ? "Rejecting…" : "Confirm Reject"}
          </button>
          <button
            type="button"
            onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
