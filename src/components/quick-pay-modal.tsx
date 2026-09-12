"use client";

import { useState } from "react";
import { X, MapPin, Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, cartTotal, type CartItem } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface QuickPayModalProps {
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
  /** If provided, bypasses cart and uses these items directly (Buy Now flow) */
  buyNowItem?: { id: string; sellerId: string; name: string; price: number; image: string | null; slug: string; stock: number };
}

interface Address {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

type Step = "address" | "payment" | "done";

export function QuickPayModal({ onClose, onSuccess, buyNowItem }: QuickPayModalProps) {
  const { items: cartItems, clearCart } = useCartStore();
  const { success, error: showError } = useToast();

  // Buy Now bypasses cart
  const items: CartItem[] = buyNowItem ? [{ ...buyNowItem, quantity: 1 }] : cartItems;

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Address>({
    fullName: "", phone: "", line1: "", city: "", state: "West Bengal", pincode: "",
  });
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderNumber: string; total: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemTotal = cartTotal(items);

  function addr(field: keyof Address, val: string) {
    setAddress((a) => ({ ...a, [field]: val }));
  }

  function validateAddress(): boolean {
    if (!address.fullName.trim())              { showError("Full name is required"); return false; }
    if (address.phone.trim().length < 10)      { showError("Valid 10-digit phone required"); return false; }
    if (!address.line1.trim())                 { showError("Address line is required"); return false; }
    if (!address.city.trim())                  { showError("City is required"); return false; }
    if (address.pincode.trim().length < 6)     { showError("Valid 6-digit pincode required"); return false; }
    return true;
  }

  async function placeOrder() {
    if (!validateAddress()) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          deliveryCharge: 0,
          discount: 0,
          address: {
            fullName: address.fullName.trim(),
            phone: address.phone.trim(),
            line1: address.line1.trim(),
            city: address.city.trim(),
            state: address.state.trim() || "India",
            pincode: address.pincode.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error ?? "Failed to place order"); setPlacing(false); return; }
      setPlacedOrder({ id: data.order.id, orderNumber: data.order.orderNumber, total: data.order.total });
      if (!buyNowItem) clearCart();
      setStep("payment");
    } catch {
      showError("Network error. Please try again.");
    }
    setPlacing(false);
  }

  async function submitProof() {
    if (!placedOrder) return;
    if (!txnId.trim() || txnId.trim().length < 4) { showError("Enter UTR / Transaction ID (min 4 chars)"); return; }
    setSubmitting(true);
    try {
      // Upload screenshot if provided
      let screenshotUrl = `/uploads/proof-pending`;
      if (paymentFile) {
        const fd = new FormData();
        fd.append("file", paymentFile);
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
          orderId: placedOrder.id,
          screenshotUrl,
          transactionId: txnId.trim(),
          amount: placedOrder.total,
        }),      });
      const data = await res.json();
      if (!res.ok) { showError(data.error ?? "Failed to submit proof"); setSubmitting(false); return; }
      success("Payment submitted! Invoice generated ✅");
      setStep("done");
      onSuccess(placedOrder.orderNumber);
    } catch {
      showError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && step !== "payment") onClose(); }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[var(--border)] px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-bold text-lg text-primary-dark">
            {step === "address" ? "📍 Delivery Address"
              : step === "payment" ? "💳 Pay via PhonePe"
              : "✅ Order Confirmed!"}
          </h2>
          {step !== "payment" && (
            <button onClick={onClose} className="text-[var(--color-sage)] hover:text-primary-dark p-1 rounded-full hover:bg-cream transition">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">

          {/* ── STEP 1: ADDRESS ── */}
          {step === "address" && (
            <>
              {/* Cart summary */}
              <div className="bg-cream rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-sage)] uppercase tracking-wide">Your Order</p>
                {items.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-primary-dark font-medium">{item.name} <span className="text-[var(--color-sage)]">×{item.quantity}</span></span>
                    <span className="font-bold text-primary">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold">
                  <span className="text-primary-dark">Total</span>
                  <span className="text-primary text-base">{formatCurrency(itemTotal)}</span>
                </div>
              </div>

              {/* Address form */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-primary-dark mb-1">Full Name *</label>
                    <input value={address.fullName} onChange={(e) => addr("fullName", e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ananya Dey" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-dark mb-1">Phone *</label>
                    <input value={address.phone} onChange={(e) => addr("phone", e.target.value)}
                      type="tel" maxLength={10}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="9876543210" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-dark mb-1">Address (House, Street, Area) *</label>
                  <input value={address.line1} onChange={(e) => addr("line1", e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="12A, Park Street" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-primary-dark mb-1">City *</label>
                    <input value={address.city} onChange={(e) => addr("city", e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Kolkata" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-dark mb-1">State</label>
                    <input value={address.state} onChange={(e) => addr("state", e.target.value)}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-dark mb-1">Pincode *</label>
                    <input value={address.pincode} onChange={(e) => addr("pincode", e.target.value)}
                      maxLength={6}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="700001" />
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={placeOrder} loading={placing}>
                Place Order & Pay →
              </Button>
            </>
          )}

          {/* ── STEP 2: PAYMENT ── */}
          {step === "payment" && placedOrder && (
            <>
              {/* PhonePe QR */}
              <div className="bg-black rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-bold text-sm">₱</div>
                  <span className="text-white font-bold text-lg">PhonePe</span>
                </div>
                <p className="text-[#7b2fff] font-bold text-xs uppercase tracking-widest mb-1">ACCEPTED HERE</p>
                <p className="text-white/50 text-xs mb-4">Scan &amp; Pay Using Any UPI App</p>
                <div className="inline-block bg-white p-3 rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/phonepe-qr.png" alt="PhonePe QR — SUMAN PAL" width={190} height={190} className="rounded-lg" />
                </div>
                <p className="text-white font-bold text-2xl mt-4">{formatCurrency(placedOrder.total)}</p>
                <p className="text-white/60 text-xs mt-1">Order: {placedOrder.orderNumber}</p>
                <p className="text-white/40 text-xs mt-0.5 font-bold tracking-widest">SUMAN PAL</p>
              </div>

              {/* Cart recap */}
              <div className="bg-cream rounded-xl p-3 text-sm space-y-1">
                <p className="text-xs font-semibold text-[var(--color-sage)] uppercase tracking-wide mb-1">Order Summary</p>
                {items.length === 0 ? (
                  // cart was cleared after order placed — show total only
                  <div className="flex justify-between font-bold">
                    <span className="text-primary-dark">Total Paid</span>
                    <span className="text-primary">{formatCurrency(placedOrder.total)}</span>
                  </div>
                ) : items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-primary-dark">{item.name} ×{item.quantity}</span>
                    <span className="font-medium text-primary">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Proof form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-primary-dark mb-1">UTR / Transaction ID *</label>
                  <input value={txnId} onChange={(e) => setTxnId(e.target.value)}
                    placeholder="12-digit UTR or reference number"
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-dark mb-1">Payment Screenshot (optional)</label>
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                      paymentFile ? "border-success bg-success/5" : "border-[var(--border)] hover:border-primary/50 bg-cream/30"
                    }`}>
                      <Upload className="h-5 w-5 mx-auto mb-1 text-[var(--color-sage)]" />
                      <p className="text-sm font-medium text-primary-dark">
                        {paymentFile ? `✓ ${paymentFile.name}` : "Upload screenshot"}
                      </p>
                      <p className="text-xs text-[var(--color-sage)]">JPG or PNG from your UPI app</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setPaymentFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <Button className="w-full" size="lg" onClick={submitProof} loading={submitting}>
                  Confirm Payment ✓
                </Button>
                <p className="text-xs text-center text-[var(--color-sage)]">
                  Suman will verify your payment and process the order
                </p>
              </div>
            </>
          )}

          {/* ── STEP 3: DONE ── */}
          {step === "done" && placedOrder && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
              <h3 className="text-xl font-bold text-primary-dark">Payment Submitted! 🌿</h3>
              <div className="bg-cream rounded-xl p-4 text-sm space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-[var(--color-sage)]">Order</span>
                  <span className="font-mono font-semibold text-primary">{placedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-sage)]">Amount</span>
                  <span className="font-bold text-primary">{formatCurrency(placedOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-sage)]">Status</span>
                  <span className="text-amber-600 font-medium">Awaiting Verification</span>
                </div>
              </div>
              <p className="text-sm text-[var(--color-sage)]">
                Your invoice will appear in <strong>Invoices</strong> once Suman confirms payment.
              </p>
              <div className="flex gap-2 justify-center">
                <a href="/buyer/orders">
                  <Button size="sm">View Orders</Button>
                </a>
                <a href="/buyer/invoices">
                  <Button size="sm" variant="outline">Invoices</Button>
                </a>
                <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
