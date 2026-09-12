import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StarRating } from "@/components/ui/star-rating";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAGINATION } from "@/lib/constants";

export const metadata: Metadata = { title: "My Products" };

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const { q, page: pageStr, status } = await searchParams;
  const page  = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = PAGINATION.DEFAULT_PAGE_SIZE;
  const skip  = (page - 1) * limit;

  const where = {
    sellerId: session.user.id,
    ...(status === "active"   ? { isActive: true }  : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { category: { select: { name: true, emoji: true } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">My Products <span className="text-base font-normal text-[var(--color-sage)]">({total})</span></h1>
        <Link href="/seller/products/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Product</Button>
        </Link>
      </div>

      {/* Search & filter */}
      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="flex-1 rounded-md border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search products"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" aria-label="Filter by status">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button type="submit" variant="outline" size="md">Search</Button>
      </form>

      {products.length === 0 ? (
        <EmptyState
          icon="🌿"
          title="No products yet"
          description="Add your first plant listing to start selling on GachAdda"
          action={{ label: "Add Product", onClick: () => {} }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-card border border-[var(--border)] overflow-hidden">
              <div className="relative h-44 bg-cream">
                {p.images[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">🌿</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <Badge variant={p.isActive ? "success" : "error"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                  {p.stockStatus === "OUT_OF_STOCK" && <Badge variant="error">Out of Stock</Badge>}
                  {p.stockStatus === "LOW_STOCK"    && <Badge variant="warning">Low Stock</Badge>}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-[var(--color-sage)] mb-1">{p.category.emoji} {p.category.name}</p>
                <h2 className="font-semibold text-primary-dark line-clamp-1 mb-1">{p.name}</h2>
                <StarRating value={p.averageRating} readOnly size="sm" showCount count={p.reviewCount} className="mb-2" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary">{formatCurrency(p.finalPrice)}</span>
                    {p.discountPct > 0 && <span className="ml-2 text-xs text-[var(--color-sage)] line-through">{formatCurrency(p.price)}</span>}
                  </div>
                  <span className="text-xs text-[var(--color-sage)]">Stock: {p.stock}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/seller/products/${p.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit className="h-3.5 w-3.5" />}>Edit</Button>
                  </Link>
                  <Link href={`/products/${p.slug}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full" leftIcon={<Eye className="h-3.5 w-3.5" />}>Preview</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
