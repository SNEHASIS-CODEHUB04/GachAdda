"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

export function PaymentVerifyActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState<"verify" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
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
    success(action === "verify" ? "Payment verified ✅" : "Payment rejected");
    router.refresh();
  }

  return (
    <div className="border-t border-[var(--border)] pt-4 space-y-3">
      {showReject && (
        <Textarea
          label="Rejection Reason"
          placeholder="e.g. Transaction ID doesn't match, amount incorrect…"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          required
        />
      )}
      <div className="flex gap-3">
        <Button
          variant="primary"
          leftIcon={<CheckCircle className="h-4 w-4" />}
          loading={loading === "verify"}
          onClick={() => handleAction("verify")}
          disabled={loading !== null}
        >
          Verify Payment
        </Button>
        {!showReject ? (
          <Button
            variant="destructive"
            leftIcon={<XCircle className="h-4 w-4" />}
            onClick={() => setShowReject(true)}
            disabled={loading !== null}
          >
            Reject
          </Button>
        ) : (
          <>
            <Button
              variant="destructive"
              leftIcon={<XCircle className="h-4 w-4" />}
              loading={loading === "reject"}
              onClick={() => handleAction("reject")}
              disabled={!rejectReason.trim() || loading !== null}
            >
              Confirm Reject
            </Button>
            <Button variant="ghost" onClick={() => { setShowReject(false); setRejectReason(""); }}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
