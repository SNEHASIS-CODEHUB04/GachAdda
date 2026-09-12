import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { CATEGORIES, PAGINATION } from "@/lib/constants";
import MarketplaceFilters from "./_components/marketplace-filters";
import { ProductGrid } from "./_components/product-grid";
import { MarketplacePagination } from "./_components/marketplace-pagination";

export const metadata: Metadata = { title: "Marketplace — Browse Plants & Seeds" };

interface SearchParams { q?: string; category?: string; sort?: string; minPrice?: string; maxPrice?: string; page?: string; }

async function getProducts(params: SearchParams) {
  const page  = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = PAGINATION.DEFAULT_PAGE_SIZE;
  const skip  = (page - 1) * limit;
  const q     = params.q ?? "";
  const cat   = params.category ?? "";
  const sort  = params.sort ?? "newest";
  const minP  = parseFloat(params.minPrice ?? "0");
  const maxP  = parseFloat(params.maxPrice ?? "999999");

  const where = {
    isActive: true,
    ...(q   ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(cat ? { category: { slug: cat } }                             : {}),
    finalPrice: { gte: minP, lte: isFinite(maxP) ? maxP : 999999 },
  };

  const orderBy =
    sort === "price_asc"  ? { finalPrice: "asc"  as const } :
    sort === "price_desc" ? { finalPrice: "desc" as const } :
    sort === "popular"    ? { salesCount: "desc" as const } :
    sort === "rating"     ? { averageRating: "desc" as const } :
                            { createdAt: "desc" as const };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where, orderBy, skip, take: limit,
      select: {
        id: true, slug: true, name: true, price: true, discountPct: true,
        finalPrice: true, images: true, stockStatus: true, stock: true,
        averageRating: true, reviewCount: true,
        seller: { select: { id: true, name: true, sellerProfile: { select: { shopName: true } } } },
        category: { select: { name: true, emoji: true, slug: true } },
      },
    }),
  ]);

  return { products, total, page, totalPages: Math.ceil(total / limit) };
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { products, total, page, totalPages } = await getProducts(params);
  const activeCat = CATEGORIES.find((c) => c.slug === params.category);

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-dark">
            {activeCat ? `${activeCat.emoji} ${activeCat.label}` : "🌿 Marketplace"}
          </h1>
          <p className="text-sm text-[var(--color-sage)] mt-1">
            {total} plant{total !== 1 ? "s" : ""} available
            {params.q ? ` for "${params.q}"` : ""}
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-56 shrink-0">
            <Suspense fallback={null}>
              <MarketplaceFilters currentParams={params} />
            </Suspense>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <ProductGrid products={products} />
            {products.length > 0 && totalPages > 1 && (
              <div className="mt-8">
                <MarketplacePagination currentPage={page} totalPages={totalPages} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
