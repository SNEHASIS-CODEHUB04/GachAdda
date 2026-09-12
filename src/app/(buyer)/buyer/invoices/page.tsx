import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Download } from "lucide-react";

export const metadata: Metadata = { title: "Invoices — GachAdda" };

export default async function BuyerInvoicesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");

  const invoices = await db.invoice.findMany({
    where: { order: { buyerId: session.user.id } },
    orderBy: { issuedAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          status: true,
          items: { select: { productName: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">My Invoices</h1>
        <p className="text-sm text-[var(--color-sage)]">Download invoices for your orders</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <FileText className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No invoices yet</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">
              Invoices are generated after payment is verified by Suman
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl border border-[var(--border)] shadow-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary-dark text-sm">{inv.invoiceNumber}</p>
                  <p className="text-xs text-[var(--color-sage)]">Order: {inv.order.orderNumber}</p>
                  <p className="text-xs text-[var(--color-sage)]">{inv.order.items[0]?.productName ?? "—"}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">{formatCurrency(inv.order.total)}</p>
                <p className="text-xs text-[var(--color-sage)] mb-2">{formatDate(inv.issuedAt)}</p>
                <Link
                  href={`/api/invoices/${inv.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
