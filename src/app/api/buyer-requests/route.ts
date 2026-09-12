import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err, parsePagination } from "@/lib/api-helpers";

const createSchema = z.object({
  plantName:     z.string().min(2).max(150),
  categorySlug:  z.string().optional(),
  quantity:      z.number().int().min(1).default(1),
  budgetMin:     z.number().positive().optional(),
  budgetMax:     z.number().positive().optional(),
  referenceImage: z.string().url().optional(),
  location:      z.string().optional(),
  requiredBy:    z.string().datetime().optional(),
  description:   z.string().min(10),
  wantsDiscount: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const { skip, limit, page } = parsePagination(url);
  const isBuyer = user!.role === "BUYER";

  const where = isBuyer
    ? { buyerId: user!.id }
    : { status: "OPEN" as const };

  const [total, requests] = await Promise.all([
    db.buyerRequest.count({ where }),
    db.buyerRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        buyer:  { select: { name: true, avatarUrl: true, location: true } },
        offers: { select: { id: true, finalPrice: true, status: true, createdAt: true } },
      },
    }),
  ]);

  return ok({ requests, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth("BUYER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const data = parsed.data;
  const request = await db.buyerRequest.create({
    data: {
      ...data,
      buyerId:   user!.id,
      requiredBy: data.requiredBy ? new Date(data.requiredBy) : null,
    },
  });

  // Notify all sellers
  const sellers = await db.user.findMany({
    where: { role: "SELLER", isActive: true },
    select: { id: true },
  });
  if (sellers.length > 0) {
    await db.notification.createMany({
      data: sellers.map((s: { id: string }) => ({
        userId:  s.id,
        title:   `New Plant Request: ${data.plantName}`,
        body:    `A buyer is looking for ${data.plantName}. Budget: ₹${data.budgetMin ?? "?"}–₹${data.budgetMax ?? "?"}`,
        refType: "request",
        refId:   request.id,
      })),
      skipDuplicates: true,
    });
  }

  return ok({ request }, 201);
}

