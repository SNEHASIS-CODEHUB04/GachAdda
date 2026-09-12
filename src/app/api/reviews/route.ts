import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";

const createSchema = z.object({
  orderId:   z.string().cuid(),
  productId: z.string().cuid(),
  rating:    z.number().int().min(1).max(5),
  body:      z.string().min(20).max(1000),
  careTip:   z.string().max(500).optional(),
});

const replySchema = z.object({
  reviewId:    z.string().cuid(),
  sellerReply: z.string().min(5).max(500),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const { skip, limit, page } = parsePagination(url);

  // Return current user's own reviews
  const myReviews = url.searchParams.get("myReviews") === "true";
  if (myReviews) {
    const { user, error } = await requireAuth();
    if (error) return error;
    const reviews = await db.review.findMany({
      where: { buyerId: user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, images: true } },
        buyer:   { select: { name: true, avatarUrl: true } },
      },
    });
    return ok({ reviews });
  }

  const productId = url.searchParams.get("productId") ?? undefined;
  const sellerId  = url.searchParams.get("sellerId")  ?? undefined;

  const where = { ...(productId ? { productId } : {}), ...(sellerId ? { sellerId } : {}) };

  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        buyer:   { select: { name: true, avatarUrl: true } },
        product: { select: { name: true, slug: true, images: true } },
      },
    }),
  ]);

  return ok({ reviews, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);

  // Seller reply
  if (body?.sellerReply) {
    const { user: seller, error: e2 } = await requireAuth("SELLER");
    if (e2) return e2;
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);
    const review = await db.review.findUnique({ where: { id: parsed.data.reviewId } });
    if (!review || review.sellerId !== seller!.id) return err("Forbidden", 403);
    const updated = await db.review.update({
      where: { id: parsed.data.reviewId },
      data: { sellerReply: parsed.data.sellerReply, repliedAt: new Date() },
    });
    return ok({ review: updated });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { orderId, productId, rating, reviewBody, careTip } = { ...parsed.data, reviewBody: parsed.data.body };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== user!.id) return err("Order not found or forbidden", 404);
  if (order.status !== "DELIVERED" && order.status !== "COMPLETED")
    return err("You can only review after delivery");

  const review = await db.review.create({
    data: {
      orderId,
      productId,
      buyerId:  user!.id,
      sellerId: order.sellerId,
      rating,
      body:     reviewBody,
      careTip,
    },
  });

  // Update product average rating
  const stats = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await db.product.update({
    where: { id: productId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      reviewCount:   stats._count.rating,
    },
  });

  // Notify seller
  await db.notification.create({
    data: {
      userId:  order.sellerId,
      title:   "New Review Received ⭐",
      body:    `You received a ${rating}-star review for order ${order.orderNumber}`,
      refType: "review",
      refId:   review.id,
    },
  });

  return ok({ review }, 201);
}

