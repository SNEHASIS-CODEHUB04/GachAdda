import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";
import { generateOrderId } from "@/lib/utils";

const createSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity:  z.number().int().min(1),
  })).min(1),
  addressId:     z.string().cuid().optional(),
  deliveryCharge: z.number().min(0).default(0),
  discount:       z.number().min(0).default(0),
  address: z.object({
    fullName: z.string(),
    phone:    z.string(),
    line1:    z.string(),
    city:     z.string(),
    state:    z.string().default("India"),
    pincode:  z.string(),
  }).optional(),
});

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const url   = new URL(req.url);
  const { skip, limit, page } = parsePagination(url);
  const status = url.searchParams.get("status") ?? undefined;

  const isBuyer = user!.role === "BUYER";
  const where = {
    ...(isBuyer ? { buyerId: user!.id } : { sellerId: user!.id }),
    ...(status  ? { status: status as never } : {}),
  };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items:   { include: { product: { select: { name: true, images: true } } } },
        payment: { select: { status: true } },
        delivery:{ select: { trackingNumber: true } },
      },
    }),
  ]);

  return ok({ orders, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const { items, deliveryCharge, discount } = parsed.data;

  // Fetch products & validate seller consistency
  const productIds = items.map((i) => i.productId);
  type ProductRow = { id: string; sellerId: string; finalPrice: number; stock: number; stockStatus: string; name: string; images: string[] };
  const products: ProductRow[] = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, sellerId: true, finalPrice: true, stock: true, stockStatus: true, name: true, images: true },
  });

  if (products.length !== items.length) return err("One or more products not available");

  const sellerIds = [...new Set(products.map((p) => p.sellerId))];
  if (sellerIds.length > 1) return err("Cart items must be from the same seller");

  for (const item of items) {
    const p = products.find((x: ProductRow) => x.id === item.productId)!;
    if (p.stockStatus === "OUT_OF_STOCK" || p.stock < item.quantity)
      return err(`${p.name} is out of stock or insufficient quantity`);
  }

  const subtotal = items.reduce((sum, item) => {
    const p = products.find((x: ProductRow) => x.id === item.productId)!;
    return sum + p.finalPrice * item.quantity;
  }, 0);
  const total = subtotal + deliveryCharge - discount;

  // Create inline address if provided
  let addressId: string | undefined = parsed.data.addressId;
  if (parsed.data.address) {
    const addr = await db.address.create({
      data: {
        userId: user!.id,
        ...parsed.data.address,
      },
    });
    addressId = addr.id;
  }

  const order = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const o = await tx.order.create({
      data: {
        orderNumber: generateOrderId(),
        buyerId:      user!.id,
        sellerId:     sellerIds[0],
        addressId:    addressId ?? null,
        subtotal,
        deliveryCharge,
        discount,
        total,
        items: {
          create: items.map((item) => {
            const p = products.find((x: ProductRow) => x.id === item.productId)!;
            return {
              productId:    item.productId,
              productName:  p.name,
              productImage: p.images[0] ?? null,
              quantity:     item.quantity,
              unitPrice:    p.finalPrice,
              total:        p.finalPrice * item.quantity,
            };
          }),
        },
        payment: { create: { amount: total } },
        delivery: { create: { timeline: [] } },
      },
    });
    // Decrement stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    return o;
  });

  return ok({ order }, 201);
}
