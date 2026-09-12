import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  { name: "Indoor Plants",       slug: "indoor-plants",       emoji: "🪴" },
  { name: "Flower Plants",       slug: "flower-plants",       emoji: "🌸" },
  { name: "Fruit & Herb Plants", slug: "fruit-herb-plants",   emoji: "🌿" },
  { name: "Trees & Palms",       slug: "trees-palms",         emoji: "🌴" },
  { name: "Seeds & Bulbs",       slug: "seeds-bulbs",         emoji: "🌱" },
  { name: "Pots & Planters",     slug: "pots-planters",       emoji: "🪵" },
  { name: "Fertilizer & Tools",  slug: "fertilizer-tools",    emoji: "🧰" },
  { name: "Water Plants",        slug: "water-plants",        emoji: "💧" },
  { name: "Succulents & Cacti",  slug: "succulents-cacti",    emoji: "🌵" },
  { name: "Bonsai",              slug: "bonsai",              emoji: "🎋" },
  { name: "Air Plants",          slug: "air-plants",          emoji: "🌬️" },
  { name: "Organic Compost",     slug: "organic-compost",     emoji: "♻️" },
];

export async function GET() {
  let categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  // Auto-seed if empty
  if (categories.length === 0) {
    await Promise.all(
      DEFAULT_CATEGORIES.map((cat) =>
        db.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        })
      )
    );
    categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
  }

  return NextResponse.json({ categories });
}
