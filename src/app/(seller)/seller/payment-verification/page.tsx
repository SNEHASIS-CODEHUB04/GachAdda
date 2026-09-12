import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentVerifyActions } from "./_components/verify-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment Verification" };

export default async function PaymentVerificationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const pending = await db.payment.findMany({
    where: {
      status: "SUBMITTED",
      order: { sellerId: session.user.id },
    },
    orderBy: { updatedAt: "asc" },
    include: {
      proof: true,
      order: {
        include: {
          buyer: { select: { name: true, email: true, phone: true } },
          items: { take: 1 },
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary-dark">
        Payment Verification
        {pending.length > 0 && (
          <span className="ml-2 text-sm font-normal text-warning bg-warning/10 rounded-full px-2 py-0.5">
            {pending.length} pending
          </span>
        )}
      </h1>

      {pending.length === 0 ? (
        <EmptyState icon="✅" title="All payments verified" description="No pending payment proofs to review." />
      ) : (
        <div className="space-y-4">
          {pending.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <CardTitle className="text-base">Order: {payment.order.orderNumber}</CardTitle>
                <span className="text-sm text-[var(--color-sage)]">{formatDate(payment.updatedAt)}</span>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Buyer info */}
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-primary-dark">Buyer Details</p>
                    <p>{payment.order.buyer.name}</p>
                    <p className="text-[var(--color-sage)]">{payment.order.buyer.email}</p>
                    {payment.order.buyer.phone && <p className="text-[var(--color-sage)]">📞 {payment.order.buyer.phone}</p>}
                    <p className="text-lg font-bold text-primary mt-2">Amount: {formatCurrency(payment.amount)}</p>
                  </div>

                  {/* Payment proof */}
                  {payment.proof && (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-primary-dark">Payment Proof</p>
                      <p className="text-[var(--color-sage)]">Transaction ID: <span className="text-primary-dark font-mono">{payment.proof.transactionId}</span></p>
                      <p className="text-[var(--color-sage)]">Amount claimed: {formatCurrency(payment.proof.amount)}</p>
                      <a
                        href={payment.proof.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                        aria-label="View payment screenshot"
                      >
                        <div className="relative h-28 w-48 rounded-lg overflow-hidden border border-[var(--border)]">
                          <Image
                            src={payment.proof.screenshotUrl}
                            alt="Payment screenshot"
                            fill
                            sizes="192px"
                            className="object-cover"
                          />
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Verify / Reject actions */}
                <PaymentVerifyActions paymentId={payment.id} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
