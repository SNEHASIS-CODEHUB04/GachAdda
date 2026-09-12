import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const metadata: Metadata = { title: "Notifications — GachAdda" };

export default async function SellerNotificationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const userId = session.user.id;

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Notifications</h1>
          <p className="text-sm text-[var(--color-sage)]">{notifications.filter((n) => !n.isRead).length} unread</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Bell className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">All caught up!</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">No new notifications</p>
          </CardBody>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 transition-colors ${!n.isRead ? "bg-primary/5" : "hover:bg-cream/40"}`}
              >
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${n.isRead ? "bg-transparent" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-dark text-sm">{n.title}</p>
                  <p className="text-sm text-[var(--color-sage)]">{n.body}</p>
                  <p className="text-xs text-[var(--color-sage)] mt-1">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
