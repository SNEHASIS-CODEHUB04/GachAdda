import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-dark">Notifications 🔔</h1>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-12 w-12 text-[var(--color-sage)]" />} title="No notifications yet" description="We'll notify you about orders, offers and messages here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-3 bg-white rounded-xl shadow-card border border-[var(--border)] p-4 transition-colors", !n.isRead && "border-l-4 border-l-primary")}>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0" aria-hidden="true">🌿</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-dark">{n.title}</p>
                <p className="text-sm text-[var(--color-sage)] mt-0.5">{n.body}</p>
                <p className="text-xs text-[var(--color-sage)] mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" aria-label="Unread" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
