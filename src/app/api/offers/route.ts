import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const createSchema = z.object({
  requestId:     z.string().cuid(),
  originalPrice: z.number().positive(),
  discountAmt:   z.number().min(0).default(0),
  finalPrice:    z.number().positive(),
  deliveryCharge: z.number().min(0).default(0),
  message:       z.string().optional(),
  expiresAt:     z.string().datetime().optional(),
});

const updateSchema = z.object({
  offerId: z.string().cuid(),
  action:  z.enum(["accept", "reject", "counter"]),
  counterPrice: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const d = parsed.data;
  const request = await db.buyerRequest.findUnique({ where: { id: d.requestId } });
  if (!request) return err("Request not found", 404);

  const offer = await db.sellerOffer.create({
    data: { ...d, sellerId: user!.id, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null },
  });

  await db.$transaction([
    db.buyerRequest.update({ where: { id: d.requestId }, data: { status: "RESPONDED" } }),
    db.notification.create({
      data: {
        userId:  request.buyerId,
        title:   "You received a seller offer 💰",
        body:    `An offer of ₹${d.finalPrice} was sent for your request: ${request.plantName}`,
        refType: "offer",
        refId:   offer.id,
      },
    }),
  ]);

  return ok({ offer }, 201);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { offerId, action } = parsed.data;
  const offer = await db.sellerOffer.findUnique({ where: { id: offerId }, include: { request: true } });
  if (!offer || offer.request.buyerId !== user!.id) return err("Offer not found or forbidden", 404);

  const status = action === "accept" ? "ACCEPTED" : action === "reject" ? "REJECTED" : "COUNTERED";
  const updated = await db.sellerOffer.update({ where: { id: offerId }, data: { status } });

  if (action === "accept") {
    await db.buyerRequest.update({ where: { id: offer.requestId }, data: { status: "ACCEPTED" } });
  }

  return ok({ offer: updated });
}

