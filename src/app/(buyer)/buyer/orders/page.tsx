import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OrderStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { Package } from "lucide-react";
import { ORDER_STATUSES, PAGINATION } from "@/lib/constants";

export const metadata: Metadata = { title: "My Orders" };

const STATUS_TABS = [
  { label: "All",        value: "" },
  { label: "Active",     value: "active" },
  { label: "Pending",    value: "PAYMENT_PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "Delivered",  value: "DELIVERED" },
  { label: "Cancelled",  value: "CANCELLED" },
];

export default async function BuyerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");

  const { status, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = PAGINATION.DEFAULT_PAGE_SIZE;
  const skip  = (page - 1) * limit;

  const statusFilter =
    status === "active"
      ? { status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] as never[] } }
      : status ? { status: status as never } : {};

  const where = { buyerId: session.user.id, ...statusFilter };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: {
          take: 1,
          include: { product: { select: { name: true, images: true, slug: true } } },
        },
        payment: { select: { status: true } },
        delivery: { select: { trackingNumber: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary-dark">My Orders</h1>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Order status filter">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/buyer/orders${tab.value ? `?status=${tab.value}` : ""}`}
            role="tab"
            aria-selected={(status ?? "") === tab.value}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              (status ?? "") === tab.value
                ? "bg-primary text-white"
                : "bg-white text-primary-dark border border-[var(--border)] hover:border-primary/40"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="Once you place an order it will appear here."
          action={{ label: "Shop Now", onClick: () => {} }}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/buyer/orders/${order.id}`}
              className="flex items-center gap-4 bg-white rounded-xl shadow-card border border-[var(--border)] p-4 hover:shadow-card-md transition-shadow"
            >
              <div className="h-14 w-14 rounded-lg bg-cream flex items-center justify-center overflow-hidden flex-shrink-0">
                {order.items[0]?.product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.items[0].product.images[0]} alt="" className="h-full w-full object-cover" aria-hidden="true" />
                ) : (
                  <Package className="h-6 w-6 text-[var(--color-sage)]" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary-dark">{order.orderNumber}</p>
                <p className="text-sm text-[var(--color-sage)] truncate">{order.items[0]?.productName}</p>
                <p className="text-xs text-[var(--color-sage)] mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
