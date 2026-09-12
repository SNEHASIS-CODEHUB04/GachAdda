import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Package, Send, Tag, Heart, ArrowRight, MessageCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, timeAgo, cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function BuyerDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");

  const userId = session.user.id;

  const [activeOrders, openRequests, unreadMessages, newOffers, wishlistCount, recentOrders, recommendedProducts] =
    await Promise.all([
      db.order.count({ where: { buyerId: userId, status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] } } }),
      db.buyerRequest.count({ where: { buyerId: userId, status: { in: ["OPEN", "RESPONDED"] } } }),
      db.message.count({ where: { conversation: { participants: { some: { userId } } }, senderId: { not: userId }, isRead: false } }),
      db.sellerOffer.count({ where: { request: { buyerId: userId }, status: "PENDING" } }),
      db.wishlist.count({ where: { userId } }),
      db.order.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: { take: 1, include: { product: { select: { name: true, images: true } } } }, payment: { select: { status: true } } },
      }),
      db.product.findMany({
        where: { isActive: true, isFeatured: true },
        take: 4,
        orderBy: { salesCount: "desc" },
        select: { id: true, slug: true, name: true, finalPrice: true, images: true, discountPct: true, category: { select: { emoji: true } } },
      }),
    ]);

  const totalPurchases = await db.order.count({ where: { buyerId: userId, status: { in: ["DELIVERED", "COMPLETED"] } } });

  const summaryCards = [
    { label: "Active Orders",    value: activeOrders,    icon: <Package     className="h-5 w-5" />, href: "/buyer/orders",        color: "text-primary" },
    { label: "Total Purchases",  value: totalPurchases,  icon: <Package     className="h-5 w-5" />, href: "/buyer/orders?status=COMPLETED", color: "text-success" },
    { label: "Open Requests",    value: openRequests,    icon: <Send        className="h-5 w-5" />, href: "/buyer/requests",      color: "text-warning" },
    { label: "New Offers",       value: newOffers,       icon: <Tag         className="h-5 w-5" />, href: "/buyer/offers",        color: "text-earth" },
    { label: "Saved Plants",     value: wishlistCount,   icon: <Heart       className="h-5 w-5" />, href: "/buyer/wishlist",      color: "text-red-500" },
    { label: "Unread Messages",  value: unreadMessages,  icon: <MessageCircle className="h-5 w-5" />, href: "/buyer/messages",    color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {session.user.name.split(" ")[0]} 🌿</h1>
        <p className="text-white/70 text-sm">{BRAND.taglineEn}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card hover padding="sm" className="text-center">
              <div className={cn("flex justify-center mb-2", c.color)}>{c.icon}</div>
              <p className="text-2xl font-bold text-primary-dark">{c.value}</p>
              <p className="text-xs text-[var(--color-sage)] mt-0.5">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="p-5">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/buyer/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-[var(--border)]">
              {recentOrders.length === 0 ? (
                <p className="text-center py-10 text-[var(--color-sage)]">No orders yet. Start shopping! 🛍️</p>
              ) : (
                recentOrders.map((order) => (
                  <Link key={order.id} href={`/buyer/orders/${order.id}`} className="flex items-center gap-4 p-4 hover:bg-cream/50 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-cream flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                      {order.items[0]?.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.items[0].product.images[0]} alt="" className="h-full w-full object-cover" aria-hidden="true" />
                      ) : "🌿"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary-dark truncate">{order.orderNumber}</p>
                      <p className="text-xs text-[var(--color-sage)]">{order.items[0]?.productName}</p>
                      <p className="text-xs text-[var(--color-sage)]">{timeAgo(order.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{formatCurrency(order.total)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              <Link href="/marketplace" className="block">
                <Button variant="primary" size="md" className="w-full justify-start" leftIcon={<Package className="h-4 w-4" />}>
                  Browse Marketplace
                </Button>
              </Link>
              <Link href="/buyer/requests" className="block">
                <Button variant="outline" size="md" className="w-full justify-start" leftIcon={<Send className="h-4 w-4" />}>
                  Request a Plant
                </Button>
              </Link>
              <Link href="/community" className="block">
                <Button variant="ghost" size="md" className="w-full justify-start">
                  🌿 Community Feed
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Recommended */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {recommendedProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-lg bg-cream flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" aria-hidden="true" />
                    ) : p.category.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary-dark truncate group-hover:text-primary">{p.name}</p>
                    <p className="text-xs text-primary font-bold">{formatCurrency(p.finalPrice)}</p>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

