import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OrderStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAGINATION } from "@/lib/constants";
import { Package } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };

const STATUS_TABS = [
  { label: "All",           value: "" },
  { label: "New",           value: "PAYMENT_VERIFIED" },
  { label: "Processing",    value: "PROCESSING" },
  { label: "Packed",        value: "PACKED" },
  { label: "Dispatched",    value: "DISPATCHED" },
  { label: "Delivered",     value: "DELIVERED" },
  { label: "Cancelled",     value: "CANCELLED" },
];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const { status, page: pageStr } = await searchParams;
  const page  = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = PAGINATION.DEFAULT_PAGE_SIZE;
  const skip  = (page - 1) * limit;

  const where = {
    sellerId: session.user.id,
    ...(status ? { status: status as never } : {}),
  };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        buyer: { select: { name: true, email: true } },
        items: { take: 1 },
        payment: { select: { status: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary-dark">Orders</h1>

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/seller/orders${tab.value ? `?status=${tab.value}` : ""}`}
            role="tab"
            aria-selected={(status ?? "") === tab.value}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${(status ?? "") === tab.value ? "bg-primary text-white" : "bg-white text-primary-dark border border-[var(--border)] hover:border-primary/40"}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12 text-[var(--color-sage)]" />} title="No orders found" description="Orders will appear here once buyers complete checkout." />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 lg:hidden">
            {orders.map((o) => (
              <Link key={o.id} href={`/seller/orders/${o.id}`} className="block bg-white rounded-xl border border-[var(--border)] shadow-card p-4 hover:shadow-card-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-primary text-sm">{o.orderNumber}</p>
                    <p className="text-sm text-primary-dark">{o.buyer.name}</p>
                    <p className="text-xs text-[var(--color-sage)]">{o.buyer.email}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-sage)] truncate max-w-[160px]">{o.items[0]?.productName ?? "—"}</span>
                  <span className="font-bold text-primary shrink-0">{formatCurrency(o.total)}</span>
                </div>
                <p className="text-xs text-[var(--color-sage)] mt-1">{formatDate(o.createdAt)}</p>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm" aria-label="Orders table">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-semibold text-[var(--color-sage)] uppercase tracking-wider">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Buyer</th>
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/30 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/seller/orders/${o.id}`} className="font-semibold text-primary hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="py-3 pr-4">
                      <p>{o.buyer.name}</p>
                      <p className="text-xs text-[var(--color-sage)]">{o.buyer.email}</p>
                    </td>
                    <td className="py-3 pr-4 max-w-[150px] truncate">{o.items[0]?.productName ?? "—"}</td>
                    <td className="py-3 pr-4 font-bold text-primary">{formatCurrency(o.total)}</td>
                    <td className="py-3 pr-4 text-[var(--color-sage)]">{formatDate(o.createdAt)}</td>
                    <td className="py-3"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
