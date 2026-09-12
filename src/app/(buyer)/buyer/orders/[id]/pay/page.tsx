"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface OrderData {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  payment: { id: string; status: string } | null;
  items: { productName: string; quantity: number; unitPrice: number; total: number }[];
}

export default function PayOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [txnId, setTxnId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function submitProof() {
    if (!order?.payment) return;
    if (!txnId.trim() || txnId.trim().length < 4) {
      showError("Enter UTR / Transaction ID (min 4 chars)");
      return;
    }
    setSubmitting(true);

    // Upload screenshot if provided
    let screenshotUrl = `/uploads/proof-pending`;
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        screenshotUrl = uploadData.url;
      }
    }

    const res = await fetch("/api/payments/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        screenshotUrl,
        transactionId: txnId.trim(),
        amount: order.total,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { showError(data.error ?? "Failed"); return; }
    success("Payment submitted! Invoice generated ✅");
    setDone(true);
  }

  if (loading) return <div className="text-center py-20 text-[var(--color-sage)]">Loading…</div>;
  if (!order) return <div className="text-center py-20 text-error">Order not found.</div>;

  // Already paid
  if (order.payment?.status && order.payment.status !== "PENDING") {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <CheckCircle className="h-16 w-16 text-success mx-auto" />
        <h2 className="text-xl font-bold text-primary-dark">Payment Already Submitted</h2>
        <p className="text-sm text-[var(--color-sage)]">Status: <strong>{order.payment.status}</strong></p>
        <Link href={`/buyer/orders/${id}`}><Button>View Order</Button></Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <CheckCircle className="h-16 w-16 text-success mx-auto" />
        <h2 className="text-xl font-bold text-primary-dark">Payment Submitted! 🌿</h2>
        <p className="text-sm text-[var(--color-sage)]">Suman will verify and confirm your order.</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/buyer/orders/${id}`}><Button>Track Order</Button></Link>
          <Link href="/buyer/invoices"><Button variant="outline">View Invoice</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/buyer/orders/${id}`}>
          <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary-dark">Pay for Order</h1>
          <p className="text-sm text-[var(--color-sage)]">{order.orderNumber}</p>
        </div>
      </div>

      {/* Order items recap */}
      <Card>
        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-primary-dark">{item.productName} <span className="text-[var(--color-sage)]">×{item.quantity}</span></span>
              <span className="font-semibold text-primary">{formatCurrency(item.total)}</span>
            </div>
          ))}
          <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </CardBody>
      </Card>

      {/* PhonePe QR */}
      <Card>
        <CardBody>
          <div className="bg-black rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-bold text-sm">₱</div>
              <span className="text-white font-bold text-lg">PhonePe</span>
            </div>
            <p className="text-[#7b2fff] font-bold text-xs uppercase tracking-widest mb-1">ACCEPTED HERE</p>
            <p className="text-white/50 text-xs mb-4">Scan &amp; Pay Using Any UPI App</p>
            <div className="inline-block bg-white p-3 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/phonepe-qr.png" alt="PhonePe QR — SUMAN PAL" width={220} height={220} className="rounded-lg" />
            </div>
            <p className="text-white font-bold text-2xl mt-4">{formatCurrency(order.total)}</p>
            <p className="text-white/60 text-xs mt-1">Order: {order.orderNumber}</p>
            <p className="text-white/40 text-xs mt-0.5 tracking-widest font-bold">SUMAN PAL</p>
          </div>
        </CardBody>
      </Card>

      {/* Proof form */}
      <Card>
        <CardHeader><CardTitle>Submit Payment Proof</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">UTR / Transaction ID *</label>
            <input
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="12-digit UTR or reference number"
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-dark mb-1">Payment Screenshot (optional)</label>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                file ? "border-success bg-success/5" : "border-[var(--border)] hover:border-primary/50 bg-cream/30"
              }`}>
                <Upload className="h-5 w-5 mx-auto mb-1 text-[var(--color-sage)]" />
                <p className="text-sm font-medium text-primary-dark">{file ? `✓ ${file.name}` : "Upload screenshot"}</p>
                <p className="text-xs text-[var(--color-sage)]">JPG or PNG from your UPI app</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <Button className="w-full" size="lg" onClick={submitProof} loading={submitting}>
            Confirm Payment ✓
          </Button>
          <p className="text-xs text-center text-[var(--color-sage)]">
            Suman will verify your payment and update the order status
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
