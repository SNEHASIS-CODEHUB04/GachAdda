import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/posts/[id]/like">) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await ctx.params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return err("Post not found", 404);

  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId: id, userId: user!.id } },
  });

  if (existing) {
    await db.$transaction([
      db.postLike.delete({ where: { id: existing.id } }),
      db.post.update({ where: { id }, data: { likesCount: { decrement: 1 } } }),
    ]);
    return ok({ liked: false });
  }

  await db.$transaction([
    db.postLike.create({ data: { postId: id, userId: user!.id } }),
    db.post.update({ where: { id }, data: { likesCount: { increment: 1 } } }),
  ]);
  return ok({ liked: true });
}
