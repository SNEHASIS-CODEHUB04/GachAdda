import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, ok } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const sellerId = user!.id;

  const [
    totalProducts,
    totalOrders,
    pendingOrders,
    pendingPayments,
    revenue,
    averageRating,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    db.product.count({ where: { sellerId, isActive: true } }),
    db.order.count({ where: { sellerId } }),
    db.order.count({ where: { sellerId, status: { in: ["ORDER_ACCEPTED", "PROCESSING", "PACKED"] } } }),
    db.order.count({ where: { sellerId, status: "PAYMENT_VERIFICATION" } }),
    db.order.aggregate({
      where: { sellerId, status: { in: ["DELIVERED", "COMPLETED"] } },
      _sum: { total: true },
    }),
    db.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { take: 1, include: { product: { select: { name: true, images: true } } } } },
    }),
    db.product.findMany({
      where: { sellerId },
      orderBy: { salesCount: "desc" },
      take: 5,
      select: { id: true, name: true, images: true, salesCount: true, averageRating: true },
    }),
  ]);

  // Last 30 days sales chart (group by day)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesData = await db.order.findMany({
    where: {
      sellerId,
      status: { in: ["DELIVERED", "COMPLETED"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return ok({
    kpis: {
      totalProducts,
      totalOrders,
      pendingOrders,
      pendingPayments,
      totalRevenue: revenue._sum.total ?? 0,
      averageRating: averageRating._avg.rating ?? 0,
      reviewCount: averageRating._count.rating,
    },
    recentOrders,
    topProducts,
    salesChart: salesData.map((s: { total: number; createdAt: Date }) => ({
      date:   s.createdAt.toISOString().slice(0, 10),
      amount: s.total,
    })),
  });
}

