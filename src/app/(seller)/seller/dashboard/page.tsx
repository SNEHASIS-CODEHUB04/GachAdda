import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Package, ShoppingBag, CreditCard, BarChart2, Star, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { OrderStatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Seller Dashboard" };

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const sellerId = session.user.id;

  const [
    totalProducts,
    totalOrders,
    pendingOrders,
    pendingPayments,
    revenue,
    ratingData,
    recentOrders,
    pendingVerifications,
    newRequests,
    recentReviews,
  ] = await Promise.all([
    db.product.count({ where: { sellerId, isActive: true } }),
    db.order.count({ where: { sellerId } }),
    db.order.count({ where: { sellerId, status: { in: ["ORDER_ACCEPTED", "PROCESSING", "PACKED", "DISPATCHED"] } } }),
    db.order.count({ where: { sellerId, status: "PAYMENT_VERIFICATION" } }),
    db.order.aggregate({ where: { sellerId, status: { in: ["DELIVERED", "COMPLETED"] } }, _sum: { total: true } }),
    db.review.aggregate({ where: { sellerId }, _avg: { rating: true }, _count: { rating: true } }),
    db.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: { take: 1 },
        buyer: { select: { name: true } },
        payment: { select: { status: true } },
      },
    }),
    db.order.findMany({
      where: { sellerId, status: "PAYMENT_VERIFICATION" },
      take: 3,
      orderBy: { updatedAt: "desc" },
      include: {
        buyer: { select: { name: true } },
        payment: { include: { proof: true } },
      },
    }),
    db.buyerRequest.count({ where: { status: "OPEN" } }),
    db.review.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { buyer: { select: { name: true } }, product: { select: { name: true } } },
    }),
  ]);

  const sellerProfile = await db.sellerProfile.findUnique({ where: { userId: sellerId } });

  const kpiCards = [
    { label: "Products",         value: totalProducts,                  icon: <Package    className="h-5 w-5 text-primary" />,     href: "/seller/products" },
    { label: "Total Orders",     value: totalOrders,                    icon: <ShoppingBag className="h-5 w-5 text-earth" />,      href: "/seller/orders" },
    { label: "Active Orders",    value: pendingOrders,                  icon: <BarChart2  className="h-5 w-5 text-warning" />,     href: "/seller/orders?status=active" },
    { label: "Pending Payments", value: pendingPayments,                icon: <CreditCard className="h-5 w-5 text-info" />,        href: "/seller/payment-verification" },
    { label: "Total Revenue",    value: formatCurrency(revenue._sum.total ?? 0), icon: <BarChart2 className="h-5 w-5 text-success" />, href: "/seller/sales-history", isText: true },
    { label: "Rating",           value: (ratingData._avg.rating ?? 0).toFixed(1), icon: <Star className="h-5 w-5 text-gold" />,   href: "/seller/reviews", isText: true },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">
            {sellerProfile?.shopName ?? session.user.name} 🌿
          </h1>
          <p className="text-[var(--color-sage)] text-sm">Seller Dashboard</p>
        </div>
        <Link href="/seller/products/new">
          <Button leftIcon={<Package className="h-4 w-4" />}>+ Add Product</Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card hover padding="sm" className="text-center">
              <div className="flex justify-center mb-2">{c.icon}</div>
              <p className="text-xl font-bold text-primary-dark">{c.value}</p>
              <p className="text-xs text-[var(--color-sage)] mt-0.5">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Payment Verifications Alert */}
      {pendingPayments > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-primary-dark flex-1">
            {pendingPayments} order{pendingPayments > 1 ? "s" : ""} waiting for payment verification
          </p>
          <Link href="/seller/payment-verification">
            <Button size="sm" variant="secondary">Verify Now</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <Card padding="none">
          <CardHeader className="p-5">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/seller/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
              All orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-[var(--border)]">
            {recentOrders.length === 0 ? (
              <p className="text-center py-8 text-[var(--color-sage)]">No orders yet</p>
            ) : (
              recentOrders.map((o) => (
                <Link key={o.id} href={`/seller/orders/${o.id}`} className="flex items-center justify-between p-4 hover:bg-cream/40 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-primary-dark">{o.orderNumber}</p>
                    <p className="text-xs text-[var(--color-sage)]">by {o.buyer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(o.total)}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Payment Verifications */}
        <Card padding="none">
          <CardHeader className="p-5">
            <CardTitle>Pending Verification</CardTitle>
            <Link href="/seller/payment-verification" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-[var(--border)]">
            {pendingVerifications.length === 0 ? (
              <p className="text-center py-8 text-[var(--color-sage)]">All caught up ✅</p>
            ) : (
              pendingVerifications.map((o) => (
                <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary-dark truncate">{o.orderNumber}</p>
                    <p className="text-xs text-[var(--color-sage)]">{o.buyer.name} · {formatCurrency(o.total)}</p>
                  </div>
                  <Link href={`/seller/payment-verification?orderId=${o.id}`}>
                    <Button size="xs" variant="primary">Verify</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* New Buyer Requests */}
      {newRequests > 0 && (
        <Card>
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🌱</span>
              <div>
                <p className="font-semibold text-primary-dark">{newRequests} open plant request{newRequests > 1 ? "s" : ""}</p>
                <p className="text-sm text-[var(--color-sage)]">Buyers are looking for plants you might have</p>
              </div>
            </div>
            <Link href="/seller/buyer-requests">
              <Button variant="outline" size="sm">View Requests</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <Link href="/seller/reviews" className="text-sm text-primary hover:underline flex items-center gap-1">
              All reviews <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="space-y-4">
            {recentReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-cream flex items-center justify-center text-sm font-semibold text-primary-dark shrink-0">
                  {r.buyer.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-dark">{r.buyer.name}</p>
                  <p className="text-xs text-[var(--color-sage)]">{r.product.name}</p>
                  <p className="text-sm text-primary-dark mt-1 line-clamp-2">{r.body}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < r.rating ? "text-gold" : "text-gray-300"} aria-hidden="true">★</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
