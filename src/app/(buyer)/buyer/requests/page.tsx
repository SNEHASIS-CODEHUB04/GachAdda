import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { NewRequestForm } from "./_components/new-request-form";
import { OfferActionButtons } from "./_components/offer-action-buttons";

export const metadata: Metadata = { title: "My Requests — GachAdda" };

const STATUS_COLORS: Record<string, string> = {
  OPEN:      "bg-success/10 text-success",
  RESPONDED: "bg-blue-50 text-blue-600",
  ACCEPTED:  "bg-primary/10 text-primary",
  CLOSED:    "bg-gray-100 text-gray-500",
};

const OFFER_STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-warning/10 text-warning",
  ACCEPTED:  "bg-success/10 text-success",
  REJECTED:  "bg-error/10 text-error",
  COUNTERED: "bg-blue-50 text-blue-600",
};

export default async function BuyerRequestsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");

  const requests = await db.buyerRequest.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      offers: {
        orderBy: { createdAt: "desc" },
        include: { seller: { select: { name: true, sellerProfile: { select: { shopName: true } } } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">My Plant Requests</h1>
        <p className="text-sm text-[var(--color-sage)]">Request a plant — Suman will respond with an offer</p>
      </div>

      <NewRequestForm />

      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-primary-dark">Your Requests ({requests.length})</h2>
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary-dark">{r.plantName}</h3>
                    <p className="text-xs text-[var(--color-sage)]">{formatDate(r.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-sm text-primary-dark">{r.description}</p>

                <div className="flex flex-wrap gap-4 text-xs text-[var(--color-sage)]">
                  <span>Qty: {r.quantity}</span>
                  {r.budgetMax && <span>Budget: up to {formatCurrency(r.budgetMax)}</span>}
                  {r.location && <span>📍 {r.location}</span>}
                </div>

                {/* Offers from Suman */}
                {r.offers.length > 0 && (
                  <div className="space-y-2 border-t border-[var(--border)] pt-3">
                    <p className="text-xs font-semibold text-primary-dark">
                      {r.offers.length} Offer{r.offers.length > 1 ? "s" : ""} from Suman
                    </p>
                    {r.offers.map((o) => (
                      <div key={o.id} className="bg-cream/60 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-bold text-primary text-base">{formatCurrency(o.finalPrice)}</span>
                            {o.discountAmt > 0 && (
                              <span className="text-xs text-success ml-2">
                                (-{formatCurrency(o.discountAmt)} discount)
                              </span>
                            )}
                            <span className="text-xs text-[var(--color-sage)] ml-2">
                              from {o.seller.sellerProfile?.shopName ?? o.seller.name}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OFFER_STATUS_COLORS[o.status] ?? ""}`}>
                            {o.status}
                          </span>
                        </div>
                        {o.status === "PENDING" && (
                          <OfferActionButtons offerId={o.id} />
                        )}
                      </div>
                    ))}
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
