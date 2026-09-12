import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await ctx.params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { name: true, slug: true, images: true } } },
      },
      payment: { include: { proof: true } },
      delivery: true,
      invoice: true,
      address: true,
      reviews: true,
    },
  });

  if (!order) return err("Order not found", 404);
  if (order.buyerId !== user!.id && order.sellerId !== user!.id) return err("Forbidden", 403);

  return ok({ order });
}
