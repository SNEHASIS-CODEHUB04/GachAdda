import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { TrendingUp, Package, ShoppingBag, Star, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics — GachAdda Seller" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const sellerId = session.user.id;

  const [revenue, totalOrders, totalProducts, ratingData, topProducts, monthlyOrders] = await Promise.all([
    db.order.aggregate({ where: { sellerId, status: { in: ["DELIVERED", "COMPLETED"] } }, _sum: { total: true } }),
    db.order.count({ where: { sellerId } }),
    db.product.count({ where: { sellerId, isActive: true } }),
    db.review.aggregate({ where: { sellerId }, _avg: { rating: true }, _count: { id: true } }),
    db.product.findMany({
      where: { sellerId, isActive: true },
      orderBy: { salesCount: "desc" },
      take: 5,
      select: { id: true, name: true, salesCount: true, finalPrice: true, averageRating: true },
    }),
    db.order.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, total: true, status: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Total Revenue", value: formatCurrency(revenue._sum.total ?? 0), icon: <TrendingUp className="h-6 w-6 text-success" />, bg: "bg-success/10" },
    { label: "Total Orders", value: totalOrders.toString(), icon: <ShoppingBag className="h-6 w-6 text-earth" />, bg: "bg-earth/10" },
    { label: "Active Products", value: totalProducts.toString(), icon: <Package className="h-6 w-6 text-primary" />, bg: "bg-primary/10" },
    { label: "Avg Rating", value: (ratingData._avg.rating ?? 0).toFixed(1) + " ★", icon: <Star className="h-6 w-6 text-gold" />, bg: "bg-yellow-50" },
    { label: "Total Reviews", value: ratingData._count.id.toString(), icon: <Users className="h-6 w-6 text-info" />, bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Analytics</h1>
        <p className="text-sm text-[var(--color-sage)]">Your store performance overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} padding="sm">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-primary-dark">{s.value}</p>
            <p className="text-xs text-[var(--color-sage)] mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <CardBody>
            {topProducts.length === 0 ? (
              <p className="text-center py-6 text-[var(--color-sage)]">No sales data yet</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="text-left text-[var(--color-sage)] border-b border-[var(--border)]">
                      <th className="pb-2 font-medium px-4 sm:px-0">Product</th>
                      <th className="pb-2 font-medium text-right">Sales</th>
                      <th className="pb-2 font-medium text-right">Price</th>
                      <th className="pb-2 font-medium text-right px-4 sm:px-0">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {topProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-medium text-primary-dark px-4 sm:px-0 max-w-[120px] truncate">{p.name}</td>
                        <td className="py-2.5 text-right text-[var(--color-sage)]">{p.salesCount}</td>
                        <td className="py-2.5 text-right text-primary font-medium">{formatCurrency(p.finalPrice)}</td>
                        <td className="py-2.5 text-right text-gold px-4 sm:px-0">{"★".repeat(Math.round(p.averageRating))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardBody>
            {monthlyOrders.length === 0 ? (
              <p className="text-center py-6 text-[var(--color-sage)]">No transactions yet</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[280px]">
                  <thead>
                    <tr className="text-left text-[var(--color-sage)] border-b border-[var(--border)]">
                      <th className="pb-2 font-medium px-4 sm:px-0">Date</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium text-right px-4 sm:px-0">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {monthlyOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2.5 text-[var(--color-sage)] px-4 sm:px-0">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="py-2.5 text-right font-medium text-primary">{formatCurrency(o.total)}</td>
                        <td className="py-2.5 text-right px-4 sm:px-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === "DELIVERED" || o.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
