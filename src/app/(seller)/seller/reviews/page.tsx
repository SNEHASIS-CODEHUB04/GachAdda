import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export const metadata: Metadata = { title: "Reviews — GachAdda" };

export default async function SellerReviewsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const sellerId = session.user.id;

  const [reviews, ratingAgg] = await Promise.all([
    db.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true } },
        product: { select: { name: true } },
      },
    }),
    db.review.aggregate({ where: { sellerId }, _avg: { rating: true }, _count: { id: true } }),
  ]);

  const avgRating = ratingAgg._avg.rating ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Reviews</h1>
          <p className="text-sm text-[var(--color-sage)]">{ratingAgg._count.id} reviews</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-3xl font-bold text-primary-dark">{avgRating.toFixed(1)}</span>
          <div>
            <div className="flex text-gold text-xl">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.round(avgRating) ? "text-gold" : "text-gray-200"}>★</span>
              ))}
            </div>
            <p className="text-xs text-[var(--color-sage)]">average rating</p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Star className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No reviews yet</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">Reviews appear after buyers receive their orders</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {r.buyer.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-primary-dark text-sm">{r.buyer.name}</p>
                      <p className="text-xs text-[var(--color-sage)]">{r.product.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex text-gold">
                      {Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}
                    </div>
                    <p className="text-xs text-[var(--color-sage)]">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-primary-dark">{r.body}</p>
                {r.careTip && (
                  <p className="text-xs text-[var(--color-sage)] bg-cream/50 rounded p-2">
                    💡 Care tip: {r.careTip}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
