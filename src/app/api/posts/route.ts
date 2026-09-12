import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";

const createSchema = z.object({
  imageUrl:    z.string().url().optional(),
  caption:     z.string().min(1).max(1000),
  plantTag:    z.string().max(80).optional(),
  categoryTag: z.string().max(80).optional(),
  careTip:     z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const { skip, limit, page } = parsePagination(url, 15);
  const authorId = url.searchParams.get("author") ?? undefined;

  const where = { isRemoved: false, ...(authorId ? { authorId } : {}) };

  const [total, posts] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
  ]);

  return ok({ posts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const post = await db.post.create({
    data: { ...parsed.data, authorId: user!.id },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return ok({ post }, 201);
}

