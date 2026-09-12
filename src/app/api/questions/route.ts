import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const askSchema = z.object({
  productId: z.string().cuid(),
  question:  z.string().min(5).max(500),
});

const answerSchema = z.object({
  questionId: z.string().cuid(),
  answer:     z.string().min(2).max(1000),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const sellerId  = url.searchParams.get("sellerId");
  const unanswered = url.searchParams.get("unanswered") === "true";

  const where = {
    isPublic: true,
    ...(productId ? { productId } : {}),
    ...(sellerId  ? { sellerId }  : {}),
    ...(unanswered ? { answer: null } : {}),
  };

  const questions = await db.productQuestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      buyer:   { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  return ok({ questions });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);

  // Seller answering
  if (body?.questionId && body?.answer) {
    if (user!.role !== "SELLER") return err("Only sellers can answer questions", 403);
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const q = await db.productQuestion.findUnique({ where: { id: parsed.data.questionId } });
    if (!q || q.sellerId !== user!.id) return err("Forbidden", 403);

    const updated = await db.productQuestion.update({
      where: { id: parsed.data.questionId },
      data: { answer: parsed.data.answer, answeredAt: new Date() },
    });

    // Notify the buyer
    const product = await db.product.findUnique({
      where: { id: q.productId },
      select: { name: true },
    });
    await db.notification.create({
      data: {
        userId:  q.buyerId,
        title:   "Your question was answered! 🌿",
        body:    `The seller answered your question about ${product?.name}`,
        refType: "question",
        refId:   q.id,
      },
    });

    return ok({ question: updated });
  }

  // Buyer asking
  if (user!.role !== "BUYER") return err("Only buyers can ask questions", 403);
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true, sellerId: true, name: true },
  });
  if (!product) return err("Product not found", 404);

  const question = await db.productQuestion.create({
    data: {
      productId: product.id,
      buyerId:   user!.id,
      sellerId:  product.sellerId,
      question:  parsed.data.question,
    },
  });

  // Notify the seller
  await db.notification.create({
    data: {
      userId:  product.sellerId,
      title:   `New question about ${product.name}`,
      body:    parsed.data.question.slice(0, 100),
      refType: "question",
      refId:   question.id,
    },
  });

  return ok({ question }, 201);
}
