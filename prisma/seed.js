const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categories = [
  { slug: "indoor-plants", name: "Indoor Plants", emoji: "🪴" },
  { slug: "flower-plants", name: "Flower Plants", emoji: "🌸" },
  { slug: "fruit-herb-plants", name: "Fruit & Herb Plants", emoji: "🌿" },
  { slug: "trees-palms", name: "Trees & Palms", emoji: "🌴" },
  { slug: "seeds-bulbs", name: "Seeds & Bulbs", emoji: "🌱" },
  { slug: "pots-planters", name: "Pots & Planters", emoji: "🏺" },
  { slug: "fertilizer-tools", name: "Fertilizer & Tools", emoji: "🧪" },
  { slug: "water-plants", name: "Water Plants", emoji: "💧" },
];

async function seed() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log("Categories seeded successfully!");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
