import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  orderId:       z.string().cuid(),
  screenshotUrl: z.string().url(),
  transactionId: z.string().min(4),
  amount:        z.number().positive(),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { orderId, screenshotUrl, transactionId, amount } = parsed.data;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || order.buyerId !== user!.id) return err("Order not found or forbidden", 404);
  if (!order.payment) return err("Payment record not found", 404);
  if (order.payment.status !== "PENDING") return err("Payment already submitted or verified");

  const [proof] = await db.$transaction([
    db.paymentProof.create({
      data: { paymentId: order.payment.id, screenshotUrl, transactionId, amount },
    }),
    db.payment.update({
      where: { id: order.payment.id },
      data: { status: "SUBMITTED" },
    }),
    db.order.update({
      where: { id: orderId },
      data: { status: "PAYMENT_VERIFICATION" },
    }),
    db.notification.create({
      data: {
        userId:  order.sellerId,
        title:   "Payment Proof Received",
        body:    `Buyer submitted payment proof for Order ${order.orderNumber}`,
        refType: "order",
        refId:   orderId,
      },
    }),
  ]);

  return ok({ proof }, 201);
}

