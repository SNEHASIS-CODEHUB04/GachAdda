import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const patchSchema = z.object({
  name:        z.string().min(2).max(150).optional(),
  categoryId:  z.string().optional(),
  description: z.string().min(10).optional(),
  price:       z.coerce.number().positive().optional(),
  discountPct: z.coerce.number().min(0).max(90).optional(),
  stock:       z.coerce.number().int().min(0).optional(),
  isActive:    z.boolean().optional(),
  images:      z.array(z.string()).max(4).optional(),
  age:         z.string().nullish(),
  height:      z.string().nullish(),
  sunlight:    z.string().nullish(),
  watering:    z.string().nullish(),
  soil:        z.string().nullish(),
  careTips:    z.string().nullish(),
});

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { id } = await ctx.params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      seller:   { select: { id: true, name: true, sellerProfile: { select: { shopName: true } } } },
      category: { select: { name: true, emoji: true, slug: true } },
    },
  });
  if (!product) return err("Product not found", 404);
  return ok({ product });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;
  const { id } = await ctx.params;

  const existing = await db.product.findUnique({ where: { id }, select: { sellerId: true, price: true, discountPct: true } });
  if (!existing || existing.sellerId !== user!.id) return err("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const d = parsed.data;
  const price       = (d.price       ?? existing.price);
  const discountPct = (d.discountPct ?? existing.discountPct);
  const finalPrice  = price * (1 - discountPct / 100);

  const updated = await db.product.update({
    where: { id },
    data: {
      ...d,
      finalPrice,
      ...(d.stock !== undefined
        ? { stockStatus: d.stock === 0 ? "OUT_OF_STOCK" : d.stock <= 5 ? "LOW_STOCK" : "IN_STOCK" }
        : {}),
    },
  });
  return ok({ product: updated });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;
  const { id } = await ctx.params;

  const existing = await db.product.findUnique({ where: { id }, select: { sellerId: true } });
  if (!existing || existing.sellerId !== user!.id) return err("Forbidden", 403);

  await db.product.update({ where: { id }, data: { isActive: false } });
  return ok({ deleted: true });
}
