import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowRight, Leaf, ShieldCheck, Truck, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { formatCurrency } from "@/lib/utils";
import { BRAND, CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: `${BRAND.name} — গাছ নিয়ে আড্ডা, সবুজে ভরা জীবন`,
  description: "India's most loved plant community & marketplace. Buy & sell plants, seeds, pots and more. Join a thriving community of plant lovers.",
};

async function getFeaturedProducts() {
  return db.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    orderBy: { salesCount: "desc" },
    select: {
      id: true, slug: true, name: true, price: true, discountPct: true,
      finalPrice: true, images: true, stockStatus: true, averageRating: true,
      reviewCount: true,
      seller: { select: { name: true, sellerProfile: { select: { shopName: true } } } },
      category: { select: { name: true, emoji: true } },
    },
  });
}

async function getLatestPosts() {
  return db.post.findMany({
    where: { isRemoved: false },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, avatarUrl: true } }, _count: { select: { likes: true, comments: true } } },
  });
}

async function getFeaturedSellers() {
  return db.sellerProfile.findMany({
    take: 4,
    orderBy: { averageRating: "desc" },
    where: { isVerified: true },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, location: true } },
    },
  });
}

export default async function LandingPage() {
  const [featuredProducts, latestPosts, featuredSellers] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getLatestPosts().catch(() => []),
    getFeaturedSellers().catch(() => []),
  ]);

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative gradient-primary py-24 md:py-32 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-black/10 pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="gold" className="mb-5 text-sm px-4 py-1.5">
              🌿 India&apos;s Plant Community
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white mb-4">
              গাছ নিয়ে আড্ডা,<br />
              <span className="text-gold">সবুজে ভরা জীবন</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl">
              Discover, buy, and sell plants, seeds, and pots. Connect with a thriving community of plant lovers across India.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/marketplace">
                <Button size="lg" variant="gold" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Shop Plants
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="cream">
                  Join Community
                </Button>
              </Link>
            </div>
            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/70">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> Secure Payments</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Nationwide Delivery</span>
              <span className="flex items-center gap-2"><Star className="h-4 w-4 text-gold" /> Verified Sellers</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="py-16 bg-white" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 id="categories-heading" className="text-3xl font-bold text-primary-dark">
                Browse by Category
              </h2>
              <p className="mt-1 text-[var(--color-sage)]">Find exactly what your garden needs</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/marketplace?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-cream p-5 text-center
                           hover:bg-primary hover:text-white transition-colors duration-200"
                aria-label={cat.label}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                  {cat.emoji}
                </span>
                <span className="text-xs font-semibold text-primary-dark group-hover:text-white line-clamp-2 leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-16 bg-cream" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 id="featured-heading" className="text-3xl font-bold text-primary-dark">Featured Plants</h2>
              <p className="mt-1 text-[var(--color-sage)]">Handpicked by our community</p>
            </div>
            <Link href="/marketplace" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-lg transition-shadow">
                  <div className="relative h-44 bg-cream overflow-hidden">
                    {p.images[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">🌿</div>
                    )}
                    {p.discountPct > 0 && (
                      <Badge variant="success" className="absolute top-2 left-2">-{p.discountPct}%</Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[var(--color-sage)] mb-0.5">{p.category.emoji} {p.category.name}</p>
                    <h3 className="text-sm font-semibold text-primary-dark line-clamp-2 mb-1">{p.name}</h3>
                    <StarRating value={p.averageRating} readOnly size="sm" />
                    <p className="mt-1 text-base font-bold text-primary">{formatCurrency(p.finalPrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 bg-white" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="how-heading" className="text-3xl font-bold text-primary-dark">How GachAdda Works</h2>
            <p className="mt-2 text-[var(--color-sage)]">Simple, trusted, and community-driven</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", icon: "🔍", title: "Discover",     desc: "Browse hundreds of plants, seeds, and pots from verified sellers." },
              { step: "02", icon: "💬", title: "Negotiate",    desc: "Chat directly with sellers, request custom plants, or ask for discounts." },
              { step: "03", icon: "💳", title: "Pay via UPI",  desc: "Simple and secure UPI/QR payment — no card required." },
              { step: "04", icon: "🌱", title: "Grow Together",desc: "Share your journey in the community feed and help others grow." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="text-4xl mb-2" aria-hidden="true">{s.icon}</div>
                  <span className="absolute -top-2 -right-3 text-xs font-bold text-gold">{s.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-primary-dark mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--color-sage)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Preview ── */}
      {latestPosts.length > 0 && (
        <section className="py-16 bg-cream" aria-labelledby="community-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 id="community-heading" className="text-3xl font-bold text-primary-dark">Community Feed</h2>
                <p className="mt-1 text-[var(--color-sage)]">See what plant lovers are sharing</p>
              </div>
              <Link href="/community" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                Explore <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {latestPosts.map((post) => (
                <Link key={post.id} href="/community" className="group relative rounded-xl overflow-hidden bg-white shadow-card hover:shadow-card-lg transition-shadow aspect-square">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.caption.slice(0, 60)}
                      fill
                      sizes="(max-width: 640px) 50vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-cream text-4xl" aria-hidden="true">🌿</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="flex items-center gap-3 text-white text-xs">
                      <span>❤️ {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Sellers ── */}
      {featuredSellers.length > 0 && (
        <section className="py-16 bg-white" aria-labelledby="sellers-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 id="sellers-heading" className="text-3xl font-bold text-primary-dark">Trusted Sellers</h2>
              <p className="mt-1 text-[var(--color-sage)]">Verified plant experts you can rely on</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredSellers.map((sp) => (
                <Link key={sp.id} href={`/sellers/${sp.userId}`} className="flex flex-col items-center text-center bg-cream rounded-2xl p-6 hover:shadow-card-md transition-shadow group">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-primary mb-3">
                    {sp.user.avatarUrl ? (
                      <Image src={sp.user.avatarUrl} alt={sp.shopName} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-bold text-white">
                        {sp.shopName[0]}
                      </div>
                    )}
                    {sp.isVerified && (
                      <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-success border-2 border-white" aria-label="Verified seller">
                        <ShieldCheck className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-primary-dark group-hover:text-primary transition-colors">{sp.shopName}</h3>
                  {sp.user.location && <p className="text-xs text-[var(--color-sage)] mt-0.5">{sp.user.location}</p>}
                  <StarRating value={sp.averageRating} readOnly size="sm" className="mt-2" />
                  <p className="text-xs text-[var(--color-sage)] mt-0.5">({sp.reviewCount} reviews)</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      <section className="py-16 gradient-earth text-white" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">🌱</div>
          <h2 id="cta-heading" className="text-3xl font-bold mb-3">Ready to start your plant journey?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Join thousands of plant lovers on GachAdda. Buy, sell, share, and grow together.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" variant="gold" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Create Free Account
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
