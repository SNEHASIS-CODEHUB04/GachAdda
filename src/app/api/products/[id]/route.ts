import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { id } = await ctx.params;

  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    include: {
      seller: {
        select: {
          id: true, name: true, avatarUrl: true,
          sellerProfile: { select: { shopName: true, shopBio: true, shopLogoUrl: true, averageRating: true, reviewCount: true, isVerified: true } },
        },
      },
      category: { select: { id: true, name: true, emoji: true, slug: true } },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { buyer: { select: { name: true, avatarUrl: true } } },
      },
    },
  });

  if (!product) return err("Product not found", 404);
  return ok({ product });
}

const updateSchema = z.object({
  name:        z.string().min(2).max(150).optional(),
  description: z.string().min(10).optional(),
  price:       z.number().positive().optional(),
  discountPct: z.number().min(0).max(90).optional(),
  stock:       z.number().int().min(0).optional(),
  images:      z.array(z.string().url()).max(6).optional(),
  isActive:    z.boolean().optional(),
  isFeatured:  z.boolean().optional(),
  age:         z.string().optional(),
  height:      z.string().optional(),
  sunlight:    z.string().optional(),
  watering:    z.string().optional(),
  soil:        z.string().optional(),
  careTips:    z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const { id } = await ctx.params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.sellerId !== user!.id) return err("Not found or forbidden", 404);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const d = parsed.data;
  const price       = d.price       ?? product.price;
  const discountPct = d.discountPct ?? product.discountPct;
  const stock       = d.stock       ?? product.stock;

  const updated = await db.product.update({
    where: { id },
    data: {
      ...d,
      finalPrice:  price * (1 - discountPct / 100),
      stockStatus: stock === 0 ? "OUT_OF_STOCK" : stock <= 5 ? "LOW_STOCK" : "IN_STOCK",
    },
  });

  return ok({ product: updated });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const { id } = await ctx.params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product || product.sellerId !== user!.id) return err("Not found or forbidden", 404);

  await db.product.update({ where: { id }, data: { isActive: false } });
  return ok({ message: "Product deactivated" });
}
