import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({ sellerId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { sellerId } = parsed.data;
  if (sellerId === user!.id) return err("Cannot chat with yourself");

  const seller = await db.user.findUnique({ where: { id: sellerId, role: "SELLER" }, select: { id: true } });
  if (!seller) return err("Seller not found", 404);

  // Find existing conversation between these two
  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user!.id } } },
        { participants: { some: { userId: sellerId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) return ok({ conversationId: existing.id });

  const conv = await db.conversation.create({
    data: { participants: { create: [{ userId: user!.id }, { userId: sellerId }] } },
    select: { id: true },
  });
  return ok({ conversationId: conv.id }, 201);
}
