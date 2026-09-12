"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

interface ReviewItem {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  product: { name: string; images: string[] };
}

interface PendingItem {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string | null;
}

export default function BuyerReviewsPage() {
  const { success, error: showError } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<PendingItem | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [rRes, oRes] = await Promise.all([
        fetch("/api/reviews?myReviews=true"),
        fetch("/api/orders?status=DELIVERED"),
      ]);
      const rData = rRes.ok ? await rRes.json() : { reviews: [] };
      const oData = oRes.ok ? await oRes.json() : { orders: [] };

      setReviews(rData.reviews ?? []);

      // Build pending list: delivered orders that have no review yet
      const reviewedOrderIds = new Set((rData.reviews ?? []).map((r: ReviewItem & { orderId?: string }) => r.orderId));
      const pendingList: PendingItem[] = [];
      for (const order of (oData.orders ?? [])) {
        if (!reviewedOrderIds.has(order.id)) {
          for (const item of (order.items ?? [])) {
            pendingList.push({
              orderId: order.id,
              orderNumber: order.orderNumber,
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage ?? null,
            });
          }
        }
      }
      setPending(pendingList);
      setLoading(false);
    }
    load();
  }, []);

  async function submitReview() {
    if (!modal) return;
    if (body.trim().length < 10) { showError("Review must be at least 10 characters"); return; }
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: modal.orderId, productId: modal.productId, rating, body }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { showError(data.error ?? "Failed to submit"); return; }
    success("Review submitted! Thank you 🌿");
    setReviews((prev) => [{ ...data.review, product: { name: modal.productName, images: modal.productImage ? [modal.productImage] : [] } }, ...prev]);
    setPending((prev) => prev.filter((p) => !(p.orderId === modal.orderId && p.productId === modal.productId)));
    setModal(null);
    setRating(5);
    setBody("");
  }

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-dark">My Reviews</h1>
      {[1,2].map((i) => <div key={i} className="h-20 rounded-xl bg-cream animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-dark">My Reviews</h1>

      {/* Pending reviews — delivered orders not yet reviewed */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-primary-dark">
            Write a Review <span className="text-[var(--color-sage)] font-normal">({pending.length} pending)</span>
          </h2>
          {pending.map((item) => (
            <Card key={`${item.orderId}-${item.productId}`} className="border-l-4 border-l-primary">
              <CardBody className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-cream overflow-hidden shrink-0">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>}
                  </div>
                  <div>
                    <p className="font-semibold text-primary-dark text-sm">{item.productName}</p>
                    <p className="text-xs text-[var(--color-sage)]">Order {item.orderNumber}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => { setModal(item); setRating(5); setBody(""); }}>
                  ⭐ Write Review
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Existing reviews */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-primary-dark">Reviews Written ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <Card><CardBody className="text-center py-10">
            <Star className="h-10 w-10 text-[var(--color-sage)] mx-auto mb-2" />
            <p className="font-semibold text-primary-dark">No reviews yet</p>
            <p className="text-sm text-[var(--color-sage)]">You can review after your orders are delivered</p>
          </CardBody></Card>
        ) : reviews.map((r) => (
          <Card key={r.id}>
            <CardBody className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-cream overflow-hidden shrink-0">
                {r.product.images[0]
                  ? <img src={r.product.images[0]} alt={r.product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary-dark">{r.product.name}</p>
                <div className="flex my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < r.rating ? "text-gold" : "text-gray-200"} style={{ fontSize: "1rem" }}>★</span>
                  ))}
                </div>
                <p className="text-sm text-primary-dark">{r.body}</p>
                <p className="text-xs text-[var(--color-sage)] mt-1">{formatDate(new Date(r.createdAt))}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Write Review Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-primary-dark">Review: {modal.productName}</h2>
            <div>
              <p className="text-sm font-medium text-primary-dark mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    className={`text-3xl transition-colors ${star <= rating ? "text-gold" : "text-gray-200 hover:text-gold/50"}`}
                    aria-label={`${star} stars`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1">Your Review *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Share your experience — quality, packaging, plant health…"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                minLength={10}
                maxLength={1000}
              />
              <p className="text-xs text-right text-[var(--color-sage)] mt-0.5">{body.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={submitReview} loading={submitting}>Submit Review</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
