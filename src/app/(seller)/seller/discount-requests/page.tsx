import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tag } from "lucide-react";
import { DiscountActions } from "./_components/discount-actions";

export const metadata: Metadata = { title: "Discount Requests — GachAdda" };

export default async function DiscountRequestsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const negotiations = await db.discountNegotiation.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, finalPrice: true, images: true } },
      buyer:   { select: { name: true, email: true } },
    },
  });

  const statusColors: Record<string, string> = {
    OPEN:     "bg-warning/10 text-warning",
    ACCEPTED: "bg-success/10 text-success",
    REJECTED: "bg-error/10 text-error",
    EXPIRED:  "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Discount Requests</h1>
        <p className="text-sm text-[var(--color-sage)]">Buyers negotiating prices on your products</p>
      </div>

      {negotiations.length === 0 ? (
        <Card><CardBody className="text-center py-16">
          <Tag className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
          <p className="font-semibold text-primary-dark">No discount requests yet</p>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {negotiations.map((n) => (
            <Card key={n.id}>
              <CardBody className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-cream overflow-hidden shrink-0">
                    {n.product.images[0]
                      ? <img src={n.product.images[0]} alt={n.product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-primary-dark">{n.product.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[n.status] ?? ""}`}>{n.status}</span>
                    </div>
                    <p className="text-xs text-[var(--color-sage)]">by {n.buyer.name} · {formatDate(n.createdAt)}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-[var(--color-sage)] line-through">{formatCurrency(n.product.finalPrice)}</span>
                      <span className="text-primary font-bold">{formatCurrency(n.askPrice)}</span>
                      <span className="text-xs text-success">({Math.round((1 - n.askPrice / n.product.finalPrice) * 100)}% off)</span>
                      <span className="text-xs text-[var(--color-sage)]">Qty: {n.quantity}</span>
                    </div>
                  </div>
                </div>
                {n.status === "OPEN" && (
                  <DiscountActions id={n.id} askPrice={n.askPrice} originalPrice={n.product.finalPrice} />
                )}
                {n.finalPrice && (
                  <p className="text-xs text-success">✅ Agreed price: {formatCurrency(n.finalPrice)}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
