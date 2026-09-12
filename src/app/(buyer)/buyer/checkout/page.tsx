"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCartStore, cartTotal } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, MapPin, CheckCircle, Upload } from "lucide-react";

interface Address {
  fullName: string; phone: string; line1: string;
  city: string; state: string; pincode: string;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const total = cartTotal(items);
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<"address" | "review" | "payment" | "done">("address");
  const [address, setAddress] = useState<Address>({ fullName: "", phone: "", line1: "", city: "", state: "", pincode: "" });
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderNumber: string; total: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [txnId, setTxnId] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

  if (items.length === 0 && step !== "done") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-primary-dark">Checkout</h1>
        <Card><CardBody className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
          <p className="font-semibold text-primary-dark">Your cart is empty</p>
          <Link href="/marketplace"><Button className="mt-4" size="sm">Browse Plants</Button></Link>
        </CardBody></Card>
      </div>
    );
  }

  function validateAddress(): boolean {
    if (!address.fullName.trim()) { showError("Full name is required"); return false; }
    if (address.phone.trim().length < 10) { showError("Valid 10-digit phone required"); return false; }
    if (!address.line1.trim()) { showError("Address is required"); return false; }
    if (!address.city.trim()) { showError("City is required"); return false; }
    if (address.pincode.trim().length < 6) { showError("Valid 6-digit pincode required"); return false; }
    return true;
  }

  async function placeOrder() {
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
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            city: address.city,
            state: address.state || "India",
            pincode: address.pincode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error ?? "Failed to place order"); setPlacing(false); return; }
      setPlacedOrder({ id: data.order.id, orderNumber: data.order.orderNumber, total: data.order.total });
      clearCart();
      setStep("payment");
    } catch {
      showError("Network error — please try again");
    }
    setPlacing(false);
  }

  async function submitPaymentProof() {
    if (!placedOrder) return;
    if (!paymentFile) { showError("Please upload a payment screenshot"); return; }
    if (!txnId.trim() || txnId.trim().length < 4) { showError("Please enter the UTR / Transaction ID"); return; }
    setSubmittingProof(true);
    const res = await fetch("/api/payments/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: placedOrder.id,
        screenshotUrl: `/uploads/payment-${placedOrder.id}.jpg`,
        transactionId: txnId.trim(),
        amount: placedOrder.total,
      }),
    });
    const data = await res.json();
    setSubmittingProof(false);
    if (!res.ok) { showError(data.error ?? "Failed to submit"); return; }
    success("Payment proof submitted! Seller will verify shortly 🌿");
    setStep("done");
  }

  const STEPS = ["address", "review", "payment"];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary-dark">Checkout</h1>

      {/* Step bar */}
      {step !== "done" && (
        <div className="flex items-center gap-1 text-xs font-medium">
          {["Delivery", "Review", "Payment"].map((label, i) => {
            const s = STEPS[i];
            const active = step === s;
            const done = STEPS.indexOf(step) > i;
            return (
              <div key={label} className="flex items-center gap-1">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-cream text-[var(--color-sage)]"
                }`}>{done ? "✓" : i + 1}</div>
                <span className={active ? "text-primary" : done ? "text-success" : "text-[var(--color-sage)]"}>{label}</span>
                {i < 2 && <span className="text-[var(--color-sage)] mx-1">›</span>}
              </div>
            );
          })}
        </div>
      )}

      {step === "done" ? (
        <Card><CardBody className="text-center py-16 space-y-4">
          <CheckCircle className="h-16 w-16 text-success mx-auto" />
          <h2 className="text-xl font-bold text-primary-dark">Order Placed! 🌿</h2>
          {placedOrder && <p className="text-sm text-[var(--color-sage)]">Order <strong>{placedOrder.orderNumber}</strong> submitted. Suman will verify your payment and process it shortly.</p>}
          <div className="flex gap-3 justify-center">
            <Link href="/buyer/orders"><Button>View My Orders</Button></Link>
            <Link href="/marketplace"><Button variant="outline">Continue Shopping</Button></Link>
          </div>
        </CardBody></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">

            {/* STEP 1 — Address */}
            {step === "address" && (
              <Card>
                <CardHeader><CardTitle><MapPin className="h-4 w-4 inline mr-1" />Delivery Address</CardTitle></CardHeader>
                <CardBody className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">Full Name *</label>
                      <input value={address.fullName} onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))} type="text" className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">Phone *</label>
                      <input value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} type="tel" maxLength={10} className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-dark mb-1">Address (House, Street, Area) *</label>
                    <input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} type="text" className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">City *</label>
                      <input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">State</label>
                      <input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">Pincode *</label>
                      <input value={address.pincode} onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))} maxLength={6} className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => { if (validateAddress()) setStep("review"); }}>
                    Continue →
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* STEP 2 — Review */}
            {step === "review" && (
              <Card>
                <CardHeader><CardTitle>Review Your Order</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-cream overflow-hidden shrink-0">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-dark truncate">{item.name}</p>
                          <p className="text-xs text-[var(--color-sage)]">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-primary text-sm shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-cream/50 rounded-lg p-3 text-sm space-y-0.5">
                    <p className="font-medium text-primary-dark">📍 Delivering to:</p>
                    <p className="text-[var(--color-sage)]">{address.fullName} · {address.phone}</p>
                    <p className="text-[var(--color-sage)]">{address.line1}, {address.city} {address.pincode}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep("address")} className="flex-1">← Back</Button>
                    <Button onClick={placeOrder} loading={placing} className="flex-1">Place Order & Pay →</Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* STEP 3 — PhonePe QR Payment */}
            {step === "payment" && placedOrder && (
              <Card>
                <CardHeader><CardTitle>Pay via PhonePe</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <div className="text-center bg-black rounded-2xl p-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-bold text-sm">₱</div>
                      <span className="text-white font-bold text-lg">PhonePe</span>
                    </div>
                    <p className="text-[#7b2fff] font-bold text-sm uppercase tracking-wider mb-1">ACCEPTED HERE</p>
                    <p className="text-white/60 text-xs mb-4">Scan &amp; Pay Using PhonePe App</p>
                    <div className="inline-block bg-white p-3 rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/phonepe-qr.png" alt="PhonePe QR — SUMAN PAL" width={200} height={200} className="rounded-lg" />
                    </div>
                    <p className="text-white font-bold text-xl mt-4">{formatCurrency(placedOrder.total)}</p>
                    <p className="text-white/70 text-xs mt-1">Order: {placedOrder.orderNumber}</p>
                    <p className="text-white/50 text-xs mt-0.5 font-bold tracking-widest">SUMAN PAL</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-primary-dark">After paying, fill in the details below:</p>
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">UTR / Transaction ID *</label>
                      <input
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        type="text"
                        placeholder="12-digit UTR or reference number"
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary-dark mb-1">Payment Screenshot *</label>
                      <label className="block cursor-pointer">
                        <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
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
                    <Button className="w-full" onClick={submitPaymentProof} loading={submittingProof}>
                      Submit Payment Proof
                    </Button>
                    <p className="text-xs text-center text-[var(--color-sage)]">
                      Suman will verify your payment and confirm the order within 1–2 hours
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Summary sidebar */}
          <Card className="h-fit">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-primary-dark truncate flex-1 mr-2">{item.name} <span className="text-[var(--color-sage)]">×{item.quantity}</span></span>
                  <span className="font-medium text-primary shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-[var(--border)] pt-2 space-y-1">
                <div className="flex justify-between text-xs text-[var(--color-sage)]"><span>Delivery</span><span>Free</span></div>
                <div className="flex justify-between font-bold text-base">
                  <span className="text-primary-dark">Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
