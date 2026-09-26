import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditProductForm } from "./_components/edit-product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true, price: true, discountPct: true,
        stock: true, categoryId: true, isActive: true, images: true,
        age: true, height: true, sunlight: true, watering: true, soil: true, careTips: true,
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, emoji: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-primary-dark mb-5">Edit Product</h1>
      <EditProductForm product={product} categories={categories} />
    </div>
  );
}
