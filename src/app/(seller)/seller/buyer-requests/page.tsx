import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Send } from "lucide-react";
import { MakeOfferForm } from "./_components/make-offer-form";

export const metadata: Metadata = { title: "Buyer Requests — GachAdda" };

export default async function SellerBuyerRequestsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const requests = await db.buyerRequest.findMany({
    where: { status: { in: ["OPEN", "RESPONDED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, location: true } },
      offers: {
        where: { sellerId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const statusColors: Record<string, string> = {
    OPEN:      "bg-success/10 text-success",
    RESPONDED: "bg-blue-50 text-blue-600",
    ACCEPTED:  "bg-primary/10 text-primary",
    CLOSED:    "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Buyer Requests</h1>
        <p className="text-sm text-[var(--color-sage)]">Plants buyers are looking for — make an offer to win the sale!</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Send className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No open requests right now</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">When buyers post requests, they appear here</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-primary-dark">{r.plantName}</h3>
                    <p className="text-xs text-[var(--color-sage)]">
                      by {r.buyer.name}{r.buyer.location ? ` · 📍 ${r.buyer.location}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-primary-dark">{r.description}</p>
                <div className="flex gap-4 text-xs text-[var(--color-sage)]">
                  <span>Qty: {r.quantity}</span>
                  {(r.budgetMin || r.budgetMax) && (
                    <span>Budget: {r.budgetMin ? formatCurrency(r.budgetMin) : "?"} – {r.budgetMax ? formatCurrency(r.budgetMax) : "?"}</span>
                  )}
                  <span>{formatDate(r.createdAt)}</span>
                </div>

                {/* Show existing offer or form */}
                {r.offers[0] ? (
                  <div className="bg-cream/60 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
                    <span className="text-[var(--color-sage)]">Your offer:</span>
                    <span className="font-bold text-primary">{formatCurrency(r.offers[0].finalPrice)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.offers[0].status === "ACCEPTED" ? "bg-success/10 text-success" :
                      r.offers[0].status === "REJECTED" ? "bg-error/10 text-error" :
                      "bg-warning/10 text-warning"
                    }`}>{r.offers[0].status}</span>
                  </div>
                ) : (
                  <MakeOfferForm requestId={r.id} buyerBudgetMax={r.budgetMax} />
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
