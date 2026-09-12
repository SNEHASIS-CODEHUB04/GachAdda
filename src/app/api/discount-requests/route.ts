import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const createSchema = z.object({
  productId: z.string().cuid(),
  askPrice:  z.number().positive(),
  quantity:  z.number().int().min(1).default(1),
  message:   z.string().max(300).optional(),
});

const respondSchema = z.object({
  id:          z.string().cuid(),
  action:      z.enum(["accept", "reject", "counter"]),
  counterPrice: z.number().positive().optional(),
  finalPrice:   z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { productId, askPrice, quantity, message } = parsed.data;
  const product = await db.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, name: true, finalPrice: true, sellerId: true },
  });
  if (!product) return err("Product not found", 404);
  if (askPrice >= product.finalPrice) return err("Ask price must be lower than the current price");

  const neg = await db.discountNegotiation.create({
    data: {
      productId,
      buyerId:  user!.id,
      sellerId: product.sellerId,
      askPrice,
      quantity,
    },
  });

  // Notify seller
  await db.notification.create({
    data: {
      userId:  product.sellerId,
      title:   `Discount Request on ${product.name}`,
      body:    `A buyer wants to pay ₹${askPrice} (original ₹${product.finalPrice}) for ${quantity}x ${product.name}${message ? `: "${message}"` : ""}`,
      refType: "discount",
      refId:   neg.id,
    },
  });

  return ok({ negotiation: neg }, 201);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { id, action, counterPrice, finalPrice } = parsed.data;
  const neg = await db.discountNegotiation.findUnique({ where: { id } });
  if (!neg) return err("Not found", 404);

  // Seller accepts/rejects/counters
  if (user!.role === "SELLER" && neg.sellerId !== user!.id) return err("Forbidden", 403);
  // Buyer can counter back
  if (user!.role === "BUYER" && neg.buyerId !== user!.id) return err("Forbidden", 403);

  const status = action === "accept" ? "ACCEPTED" : action === "reject" ? "REJECTED" : "OPEN";
  const updated = await db.discountNegotiation.update({
    where: { id },
    data: {
      status,
      ...(finalPrice && action === "accept" ? { finalPrice } : {}),
      ...(counterPrice && action === "counter" ? { askPrice: counterPrice } : {}),
    },
  });

  // Notify the other party
  const notifyUserId = user!.role === "SELLER" ? neg.buyerId : neg.sellerId;
  await db.notification.create({
    data: {
      userId:  notifyUserId,
      title:   action === "accept" ? "Discount Accepted! 🎉" : action === "reject" ? "Discount Declined" : "Counter Offer Received",
      body:    action === "accept"
        ? `Your discount request was accepted at ₹${finalPrice ?? neg.askPrice}`
        : action === "reject"
        ? `Your discount request was declined`
        : `A counter offer of ₹${counterPrice} was made`,
      refType: "discount",
      refId:   id,
    },
  });

  return ok({ negotiation: updated });
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const isBuyer = user!.role === "BUYER";
  const where = isBuyer ? { buyerId: user!.id } : { sellerId: user!.id };

  const negotiations = await db.discountNegotiation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, finalPrice: true, images: true, slug: true } },
      buyer:   { select: { name: true } },
    },
  });

  return ok({ negotiations });
}
