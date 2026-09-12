import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tag } from "lucide-react";

export const metadata: Metadata = { title: "Offers — GachAdda" };

export default async function BuyerOffersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");
  const userId = session.user.id;

  // Get offers on buyer's requests
  const offers = await db.sellerOffer.findMany({
    where: { request: { buyerId: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      request: { select: { plantName: true } },
      seller: { select: { name: true, sellerProfile: { select: { shopName: true } } } },
    },
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    ACCEPTED: "bg-success/10 text-success",
    REJECTED: "bg-error/10 text-error",
    COUNTERED: "bg-info/10 text-info",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Offers</h1>
        <p className="text-sm text-[var(--color-sage)]">Offers from sellers on your requests</p>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Tag className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No offers yet</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">Post a request and sellers will send you offers</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id} hover>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary-dark">{o.request.plantName}</h3>
                    <p className="text-xs text-[var(--color-sage)]">
                      from {o.seller.sellerProfile?.shopName ?? o.seller.name}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? ""}`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[var(--color-sage)]">Original</p>
                    <p className="font-medium text-primary-dark line-through">{formatCurrency(o.originalPrice)}</p>
                  </div>
                  {o.discountAmt > 0 && (
                    <div>
                      <p className="text-xs text-[var(--color-sage)]">Discount</p>
                      <p className="font-medium text-error">-{formatCurrency(o.discountAmt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--color-sage)]">Final Price</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(o.finalPrice)}</p>
                  </div>
                </div>
                {o.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Accept Offer</Button>
                    <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
