import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Download } from "lucide-react";

export const metadata: Metadata = { title: "Sales History — GachAdda" };

export default async function SalesHistoryPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const sellerId = session.user.id;

  const paidStatuses = ["PAYMENT_VERIFIED", "ORDER_ACCEPTED", "PROCESSING", "PACKED", "DISPATCHED", "DELIVERED", "COMPLETED"] as const;

  const [revenue, monthRevenue, orders] = await Promise.all([
    db.order.aggregate({
      where: { sellerId, status: { in: [...paidStatuses] } },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: {
        sellerId,
        status: { in: [...paidStatuses] },
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { total: true },
    }),
    db.order.findMany({
      where: { sellerId, status: { in: [...paidStatuses] } },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true } },
        items: { select: { productName: true, quantity: true, total: true } },
        payment: { select: { status: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Sales History</h1>
        <p className="text-sm text-[var(--color-sage)]">All completed orders and revenue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-xl font-bold text-primary-dark">{formatCurrency(revenue._sum.total ?? 0)}</p>
              <p className="text-xs text-[var(--color-sage)]">Total Revenue</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xl font-bold text-primary-dark">{formatCurrency(monthRevenue._sum.total ?? 0)}</p>
              <p className="text-xs text-[var(--color-sage)]">This Month</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-earth/10"><TrendingUp className="h-5 w-5 text-earth" /></div>
            <div>
              <p className="text-xl font-bold text-primary-dark">{orders.length}</p>
              <p className="text-xs text-[var(--color-sage)]">Completed Orders</p>
            </div>
          </div>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <TrendingUp className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No completed sales yet</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Completed Orders</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-cream/50">
                <tr className="text-left text-[var(--color-sage)]">
                  <th className="px-4 py-3 font-medium">Order #</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/30">
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      <Link href={`/seller/orders/${o.id}`} className="hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-primary-dark">{o.buyer.name}</td>
                    <td className="px-4 py-3 text-[var(--color-sage)]">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-[var(--color-sage)]">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      {o.invoice ? (
                        <Link
                          href={`/api/invoices/${o.invoice.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <Download className="h-3 w-3" /> {o.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--color-sage)]">—</span>
                      )}
                    </td>
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
