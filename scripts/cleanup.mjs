import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Soft-delete Suman's test Mango (price ₹1, has order references so can't hard-delete)
const SUMAN_ID = "cmty4l2gk00002pd0i8dbh7h3";
const mangos = await db.product.findMany({
  where: { name: { contains: "Mango", mode: "insensitive" }, sellerId: SUMAN_ID },
  select: { id: true, name: true, price: true, isActive: true },
});
console.log("Suman Mangos:", mangos);

for (const p of mangos) {
  if (p.price <= 2) {
    await db.product.update({ where: { id: p.id }, data: { isActive: false } });
    console.log(`Hidden (isActive=false): ${p.name} ₹${p.price}`);
  }
}
console.log("Done!");
await db.$disconnect();
