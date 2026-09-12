import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingCart, MessageCircle, Tag, Heart, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, description: true, images: true } });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      seller: {
        select: {
          id: true, name: true, avatarUrl: true,
          sellerProfile: { select: { shopName: true, shopBio: true, averageRating: true, reviewCount: true, isVerified: true } },
        },
      },
      category: { select: { name: true, emoji: true, slug: true } },
      reviews: {
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { buyer: { select: { name: true, avatarUrl: true } } },
      },
    },
  });

  if (!product) notFound();

  const shopName = product.seller.sellerProfile?.shopName ?? product.seller.name;
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";

  // Related products
  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 4,
    select: { id: true, slug: true, name: true, finalPrice: true, images: true, discountPct: true, averageRating: true },
  });

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-sage)] mb-6 flex items-center gap-1.5">
          <Link href="/marketplace" className="hover:text-primary">Marketplace</Link>
          <span>/</span>
          <Link href={`/marketplace?category=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
          <span>/</span>
          <span className="text-primary-dark">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl" aria-hidden="true">🌿</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto" role="list" aria-label="Product images">
                {product.images.map((img, i) => (
                  <div key={i} role="listitem" className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-cream">
                    <Image src={img} alt={`${product.name} image ${i + 1}`} fill sizes="64px" className="object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="sage">{product.category.emoji} {product.category.name}</Badge>
              {product.stockStatus === "LOW_STOCK" && <Badge variant="warning">Low Stock</Badge>}
              {outOfStock && <Badge variant="error">Out of Stock</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <StarRating value={product.averageRating} readOnly size="md" />
              <span className="text-sm text-[var(--color-sage)]">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">{formatCurrency(product.finalPrice)}</span>
              {product.discountPct > 0 && (
                <>
                  <span className="text-lg text-[var(--color-sage)] line-through">{formatCurrency(product.price)}</span>
                  <Badge variant="success" className="text-sm px-3 py-1">-{product.discountPct}%</Badge>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" disabled={outOfStock} className="flex-1 sm:flex-none" leftIcon={<ShoppingCart className="h-4 w-4" />}>
                {outOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Link href={`/buyer/messages?seller=${product.seller.id}`}>
                <Button variant="outline" size="lg" leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Chat Seller
                </Button>
              </Link>
              <Button variant="outline" size="lg" leftIcon={<Tag className="h-4 w-4" />}>
                Request Discount
              </Button>
              <Button variant="ghost" size="icon" aria-label="Add to wishlist">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Care Info */}
            {(product.age || product.height || product.sunlight || product.watering || product.soil) && (
              <div className="bg-cream rounded-xl p-5 mb-6">
                <h2 className="text-base font-semibold text-primary-dark mb-3">Care Information</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Age",       value: product.age,      icon: "🪴" },
                    { label: "Height",    value: product.height,   icon: "📏" },
                    { label: "Sunlight",  value: product.sunlight, icon: "☀️" },
                    { label: "Watering",  value: product.watering, icon: "💧" },
                    { label: "Soil",      value: product.soil,     icon: "🌍" },
                  ].filter((i) => i.value).map((item) => (
                    <div key={item.label}>
                      <dt className="text-[var(--color-sage)]">{item.icon} {item.label}</dt>
                      <dd className="font-medium text-primary-dark">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                {product.careTips && <p className="mt-3 text-sm text-[var(--color-sage)]">{product.careTips}</p>}
              </div>
            )}

            {/* Seller */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card border border-[var(--border)]">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold overflow-hidden">
                {product.seller.avatarUrl ? (
                  <Image src={product.seller.avatarUrl} alt={shopName} width={48} height={48} className="object-cover" />
                ) : shopName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link href={`/sellers/${product.seller.id}`} className="font-semibold text-primary-dark hover:text-primary truncate">
                    {shopName}
                  </Link>
                  {product.seller.sellerProfile?.isVerified && (
                    <ShieldCheck className="h-4 w-4 text-success shrink-0" aria-label="Verified seller" />
                  )}
                </div>
                <p className="text-xs text-[var(--color-sage)]">
                  ⭐ {product.seller.sellerProfile?.averageRating?.toFixed(1) ?? "0.0"} · {product.seller.sellerProfile?.reviewCount ?? 0} reviews
                </p>
              </div>
              <Link href={`/sellers/${product.seller.id}`}>
                <Button variant="outline" size="sm">View Shop</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-primary-dark mb-4">About This Plant</h2>
          <p className="text-[var(--color-sage)] leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <section className="mt-12" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-xl font-bold text-primary-dark mb-6">
              Customer Reviews ({product.reviewCount})
            </h2>
            <div className="space-y-5">
              {product.reviews.map((r) => (
                <article key={r.id} className="bg-white rounded-xl shadow-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-cream flex items-center justify-center font-semibold text-primary-dark text-sm">
                      {r.buyer.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-primary-dark">{r.buyer.name}</p>
                      <p className="text-xs text-[var(--color-sage)]">{formatDate(r.createdAt)}</p>
                    </div>
                    <StarRating value={r.rating} readOnly size="sm" className="ml-auto" />
                  </div>
                  <p className="text-sm text-primary-dark">{r.body}</p>
                  {r.careTip && (
                    <p className="mt-2 text-xs text-success bg-success/5 rounded-lg p-2">💡 Care tip: {r.careTip}</p>
                  )}
                  {r.sellerReply && (
                    <div className="mt-3 ml-4 pl-3 border-l-2 border-primary/30">
                      <p className="text-xs font-semibold text-primary mb-1">Seller replied:</p>
                      <p className="text-sm text-primary-dark">{r.sellerReply}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-bold text-primary-dark mb-5">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/products/${r.slug}`} className="group bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-lg transition-shadow">
                  <div className="relative h-36 bg-cream">
                    {r.images[0] ? (
                      <Image src={r.images[0]} alt={r.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl" aria-hidden="true">🌿</div>
                    )}
                    {r.discountPct > 0 && <Badge variant="success" className="absolute top-2 left-2">-{r.discountPct}%</Badge>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-primary-dark line-clamp-2 mb-1">{r.name}</p>
                    <p className="text-base font-bold text-primary">{formatCurrency(r.finalPrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
