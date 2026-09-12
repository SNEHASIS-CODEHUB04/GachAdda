import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { ORDER_STATUSES } from "@/lib/constants";

const schema = z.object({
  status:       z.enum(ORDER_STATUSES),
  note:         z.string().optional(),
  cancelReason: z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/status">) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.sellerId !== user!.id) return err("Not found or forbidden", 404);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { status, note, cancelReason } = parsed.data;

  const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const o = await tx.order.update({
      where: { id },
      data: { status, ...(cancelReason ? { cancelReason } : {}) },
    });

    // Update delivery timeline
    const delivery = await tx.delivery.findUnique({ where: { orderId: id } });
    if (delivery) {
      const timeline = Array.isArray(delivery.timeline) ? delivery.timeline as object[] : [];
      await tx.delivery.update({
        where: { orderId: id },
        data: {
          timeline: [...timeline, { status, timestamp: new Date().toISOString(), note }],
          ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        },
      });
    }

    // Create notification for buyer
    await tx.notification.create({
      data: {
        userId: o.buyerId,
        title:  `Order ${o.orderNumber} Update`,
        body:   `Your order status changed to ${status}${note ? `: ${note}` : ""}`,
        refType: "order",
        refId:   id,
      },
    });

    return o;
  });

  return ok({ order: updated });
}
