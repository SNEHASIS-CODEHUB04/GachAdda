import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const wishlist = await db.wishlist.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true, slug: true, name: true, price: true, discountPct: true,
          finalPrice: true, images: true, stockStatus: true, stock: true,
          averageRating: true, reviewCount: true,
          seller: { select: { id: true, name: true, sellerProfile: { select: { shopName: true } } } },
          category: { select: { name: true, emoji: true, slug: true } },
        },
      },
    },
  });

  return ok({ wishlist: wishlist.map((w) => ({ ...w.product, wishlistId: w.id })) });
}

const schema = z.object({ productId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const existing = await db.wishlist.findUnique({
    where: { userId_productId: { userId: user!.id, productId: parsed.data.productId } },
  });

  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return ok({ wishlisted: false });
  }

  await db.wishlist.create({ data: { userId: user!.id, productId: parsed.data.productId } });
  return ok({ wishlisted: true }, 201);
}

