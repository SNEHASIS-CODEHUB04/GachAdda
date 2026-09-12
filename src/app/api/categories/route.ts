import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return ok({ categories });
}

