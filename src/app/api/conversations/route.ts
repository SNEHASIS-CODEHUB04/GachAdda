import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId: user!.id } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return ok({ conversations });
}

const createSchema = z.object({ participantId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { participantId } = parsed.data;
  if (participantId === user!.id) return err("Cannot start conversation with yourself");

  // Find existing conversation between the two
  const existing = await db.conversation.findFirst({
    where: {
      participants: {
        every: { userId: { in: [user!.id, participantId] } },
      },
    },
    include: { participants: true },
  });

  if (existing && existing.participants.length === 2) return ok({ conversation: existing });

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId: user!.id }, { userId: participantId }],
      },
    },
    include: { participants: true },
  });

  return ok({ conversation }, 201);
}

