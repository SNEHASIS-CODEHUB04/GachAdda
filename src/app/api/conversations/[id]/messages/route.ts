import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await ctx.params;
  const { skip, limit, page } = parsePagination(new URL(req.url), 30);

  // Verify participant
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user!.id } },
  });
  if (!participant) return err("Forbidden", 403);

  const [total, messages] = await Promise.all([
    db.message.count({ where: { conversationId: id } }),
    db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    }),
  ]);

  // Mark messages as read
  await db.message.updateMany({
    where: { conversationId: id, senderId: { not: user!.id }, isRead: false },
    data: { isRead: true },
  });

  return ok({ messages, total, page, totalPages: Math.ceil(total / limit) });
}

const sendSchema = z.object({
  body:    z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  refType: z.enum(["product", "order", "request"]).optional(),
  refId:   z.string().optional(),
});

export async function POST(req: NextRequest, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await ctx.params;
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user!.id } },
  });
  if (!participant) return err("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const message = await db.message.create({
    data: { conversationId: id, senderId: user!.id, ...parsed.data },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Update conversation updatedAt
  await db.conversation.update({ where: { id }, data: {} });

  return ok({ message }, 201);
}
