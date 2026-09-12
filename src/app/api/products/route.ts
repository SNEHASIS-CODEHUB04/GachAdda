import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";
import { slugify } from "@/lib/utils";

const createSchema = z.object({
  name:        z.string().min(2).max(150),
  categoryId:  z.string().cuid(),
  description: z.string().min(10),
  price:       z.number().positive(),
  discountPct: z.number().min(0).max(90).default(0),
  stock:       z.number().int().min(0),
  images:      z.array(z.string().url()).max(6).default([]),
  age:         z.string().optional(),
  height:      z.string().optional(),
  sunlight:    z.string().optional(),
  watering:    z.string().optional(),
  soil:        z.string().optional(),
  careTips:    z.string().optional(),
});

export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const { skip, limit, page } = parsePagination(url);
  const q        = url.searchParams.get("q")        ?? "";
  const category = url.searchParams.get("category") ?? "";
  const sort     = url.searchParams.get("sort")      ?? "newest";
  const minPrice = parseFloat(url.searchParams.get("minPrice") ?? "0");
  const maxPrice = parseFloat(url.searchParams.get("maxPrice") ?? "999999");
  const sellerId = url.searchParams.get("seller")    ?? "";

  const where: object = {
    isActive: true,
    ...(q        ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(category ? { category: { slug: category } }              : {}),
    ...(sellerId ? { sellerId }                                   : {}),
    finalPrice: { gte: minPrice, lte: maxPrice },
  };

  const orderBy =
    sort === "price_asc"  ? { finalPrice: "asc" }  as const :
    sort === "price_desc" ? { finalPrice: "desc" } as const :
    sort === "popular"    ? { salesCount: "desc" } as const :
    sort === "rating"     ? { averageRating: "desc" } as const :
                            { createdAt: "desc" }  as const;

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true, slug: true, name: true, price: true, discountPct: true,
        finalPrice: true, images: true, stockStatus: true, stock: true,
        averageRating: true, reviewCount: true,
        seller: {
          select: { id: true, name: true, sellerProfile: { select: { shopName: true } } }
        },
        category: { select: { name: true, emoji: true, slug: true } },
      },
    }),
  ]);

  return ok({ products, total, page, totalPages: Math.ceil(total / limit), limit });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("SELLER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const d = parsed.data;
  const finalPrice = d.price * (1 - d.discountPct / 100);
  const baseSlug   = slugify(d.name);

  // Ensure unique slug
  const count = await db.product.count({ where: { slug: { startsWith: baseSlug } } });
  const slug  = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

  const product = await db.product.create({
    data: {
      ...d,
      sellerId:  user!.id,
      slug,
      finalPrice,
      stockStatus: d.stock === 0 ? "OUT_OF_STOCK" : d.stock <= 5 ? "LOW_STOCK" : "IN_STOCK",
    },
  });

  return ok({ product }, 201);
}

