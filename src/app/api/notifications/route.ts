import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const { skip, limit, page } = parsePagination(url, 20);
  const unreadOnly = url.searchParams.get("unread") === "true";

  const where = {
    userId: user!.id,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [total, notifications, unreadCount] = await Promise.all([
    db.notification.count({ where }),
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.notification.count({ where: { userId: user!.id, isRead: false } }),
  ]);

  return ok({ notifications, total, page, totalPages: Math.ceil(total / limit), unreadCount });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids ?? [];

  if (ids.length > 0) {
    await db.notification.updateMany({
      where: { id: { in: ids }, userId: user!.id },
      data: { isRead: true },
    });
  } else {
    await db.notification.updateMany({
      where: { userId: user!.id, isRead: false },
      data: { isRead: true },
    });
  }

  return ok({ message: "Marked as read" });
}

