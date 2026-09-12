import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  action:       z.enum(["verify", "reject"]),
  rejectReason: z.string().optional(),
});

export async function POST(req: NextRequest, ctx: RouteContext<"/api/payments/[id]/verify">) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const { id } = await ctx.params;
  const payment = await db.payment.findUnique({
    where: { id },
    include: { order: true },
  });
  if (!payment) return err("Payment not found", 404);
  if (payment.order.sellerId !== user!.id) return err("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { action, rejectReason } = parsed.data;
  const isVerify = action === "verify";

  await db.$transaction([
    db.payment.update({
      where: { id },
      data: {
        status:       isVerify ? "VERIFIED" : "REJECTED",
        verifiedAt:   isVerify ? new Date() : null,
        rejectedAt:   isVerify ? null : new Date(),
        rejectReason: isVerify ? null : (rejectReason ?? "Payment could not be verified"),
      },
    }),
    db.order.update({
      where: { id: payment.orderId },
      data: { status: isVerify ? "PAYMENT_VERIFIED" : "PAYMENT_PENDING" },
    }),
    db.notification.create({
      data: {
        userId:  payment.order.buyerId,
        title:   isVerify ? "Payment Verified ✅" : "Payment Rejected ❌",
        body:    isVerify
          ? `Your payment for Order ${payment.order.orderNumber} has been verified!`
          : `Payment for Order ${payment.order.orderNumber} was rejected: ${rejectReason ?? "Contact seller"}`,
        refType: "order",
        refId:   payment.orderId,
      },
    }),
  ]);

  // If verified: update delivery timeline + generate invoice
  if (isVerify) {
    const delivery = await db.delivery.findUnique({ where: { orderId: payment.orderId } });
    if (delivery) {
      const existing = Array.isArray(delivery.timeline) ? delivery.timeline as object[] : [];
      await db.delivery.update({
        where: { orderId: payment.orderId },
        data: {
          timeline: [
            ...existing,
            { status: "PAYMENT_VERIFIED", timestamp: new Date().toISOString(), note: "Payment verified by seller" },
          ],
        },
      });
    }
    // Generate invoice ONLY on verification
    const invoiceNumber = `INV-${payment.order.orderNumber}`;
    await db.invoice.upsert({
      where: { orderId: payment.orderId },
      create: { orderId: payment.orderId, invoiceNumber, issuedAt: new Date() },
      update: {},
    });
  } else {
    // Rejected — delete any invoice that may have been pre-created
    await db.invoice.deleteMany({ where: { orderId: payment.orderId } });
  }

  return ok({ message: isVerify ? "Payment verified — invoice generated" : "Payment rejected" });
}
