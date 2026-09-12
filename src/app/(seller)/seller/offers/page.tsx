import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "My Offers — GachAdda" };

export default async function SellerOffersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const sellerId = session.user.id;

  const offers = await db.sellerOffer.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: { request: { select: { plantName: true, buyer: { select: { name: true } } } } },
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
        <h1 className="text-2xl font-bold text-primary-dark">My Offers</h1>
        <p className="text-sm text-[var(--color-sage)]">Offers you&apos;ve made to buyer requests</p>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <CheckCircle className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No offers made yet</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">Go to Buyer Requests to make your first offer</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Offers ({offers.length})</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/50">
                <tr className="text-left text-[var(--color-sage)]">
                  <th className="px-4 py-3 font-medium">Plant Requested</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Original Price</th>
                  <th className="px-4 py-3 font-medium">Your Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {offers.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary-dark">{o.request.plantName}</td>
                    <td className="px-4 py-3 text-[var(--color-sage)]">{o.request.buyer.name}</td>
                    <td className="px-4 py-3 text-[var(--color-sage)] line-through">{formatCurrency(o.originalPrice)}</td>
                    <td className="px-4 py-3 text-primary font-semibold">{formatCurrency(o.finalPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-sage)]">{o.expiresAt ? formatDate(o.expiresAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
