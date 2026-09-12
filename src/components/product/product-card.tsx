"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Eye, Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { QuickPayModal } from "@/components/quick-pay-modal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPct: number;
  finalPrice: number;
  images: string[];
  stockStatus: string;
  stock: number;
  averageRating: number;
  reviewCount: number;
  seller: { id: string; name: string; sellerProfile?: { shopName: string } | null };
  category: { name: string; emoji?: string | null };
}

interface ProductCardProps {
  product: ProductCardData;
  isWishlisted?: boolean;
  onWishlist?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  onBuyNow?: (id: string) => void;
  layout?: "grid" | "list";
}

export function ProductCard({
  product,
  isWishlisted,
  onWishlist,
  onAddToCart,
  onBuyNow,
  layout = "grid",
}: ProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showBuyNow, setShowBuyNow] = useState(false);
  const shopName = product.seller.sellerProfile?.shopName ?? product.seller.name;
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    if (!session?.user) { router.push("/login?callbackUrl=/marketplace"); return; }
    onBuyNow ? onBuyNow(product.id) : setShowBuyNow(true);
  }

  if (layout === "list") {
    return (
      <div className="flex gap-4 bg-white rounded-xl shadow-card border border-[var(--border)] p-4 hover:shadow-card-md transition-shadow">
        <Link href={`/products/${product.slug}`} className="shrink-0">
          <div className="relative h-28 w-28 rounded-lg overflow-hidden bg-cream">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="112px"
                className="object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl" aria-hidden="true">🌿</div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-sage mb-0.5">{product.category.emoji} {product.category.name}</p>
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            <h3 className="text-base font-semibold text-primary-dark line-clamp-1">{product.name}</h3>
          </Link>
          <p className="text-xs text-[var(--color-sage)] mt-0.5">by {shopName}</p>
          <StarRating value={product.averageRating} readOnly size="sm" showCount count={product.reviewCount} className="mt-1" />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-primary">{formatCurrency(product.finalPrice)}</span>
            {product.discountPct > 0 && (
              <>
                <span className="text-sm text-[var(--color-sage)] line-through">{formatCurrency(product.price)}</span>
                <Badge variant="success">-{product.discountPct}%</Badge>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0 justify-center">
          <Button size="sm" disabled={outOfStock} onClick={() => onAddToCart?.(product.id)}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button
            variant={isWishlisted ? "primary" : "ghost"}
            size="icon-sm"
            onClick={() => onWishlist?.(product.id)}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article className="group bg-white rounded-xl shadow-card border border-[var(--border)] overflow-hidden hover:shadow-card-lg transition-shadow duration-200">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative h-52 bg-cream overflow-hidden">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">🌿</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discountPct > 0 && <Badge variant="success">-{product.discountPct}%</Badge>}
          {outOfStock && <Badge variant="error">Out of Stock</Badge>}
          {product.stockStatus === "LOW_STOCK" && <Badge variant="warning">Low Stock</Badge>}
        </div>
        {/* Wishlist */}
        <button
          className={cn(
            "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center shadow transition-all duration-200",
            isWishlisted
              ? "bg-red-50 text-red-500"
              : "bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => { e.preventDefault(); onWishlist?.(product.id); }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} aria-hidden="true" />
        </button>
      </Link>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-[var(--color-sage)] mb-1">{product.category.emoji} {product.category.name}</p>
        <Link href={`/products/${product.slug}`} className="hover:text-primary">
          <h3 className="text-sm font-semibold text-primary-dark line-clamp-2 mb-1">{product.name}</h3>
        </Link>
        <p className="text-xs text-[var(--color-sage)] mb-2">by {shopName}</p>
        <StarRating value={product.averageRating} readOnly size="sm" showCount count={product.reviewCount} />

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-base font-bold text-primary">{formatCurrency(product.finalPrice)}</span>
          {product.discountPct > 0 && (
            <span className="text-xs text-[var(--color-sage)] line-through">{formatCurrency(product.price)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            className="flex-1"
            size="sm"
            disabled={outOfStock}
            onClick={() => onAddToCart?.(product.id)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </Button>
          {!outOfStock && (
            <Button
              size="sm"
              variant="outline"
              className="px-2.5 text-primary border-primary/40 hover:bg-primary/5"
              onClick={handleBuyNow}
              aria-label={`Buy ${product.name} now`}
              title="Buy Now"
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
          )}
          <Link href={`/products/${product.slug}`} aria-label={`View ${product.name} details`}>
            <Button variant="outline" size="icon-sm" tabIndex={-1} aria-hidden="true">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Buy Now Modal */}
      {showBuyNow && (
        <QuickPayModal
          buyNowItem={{
            id: product.id,
            sellerId: product.seller.id,
            name: product.name,
            price: product.finalPrice,
            image: product.images[0] ?? null,
            slug: product.slug,
            stock: product.stock,
          }}
          onClose={() => setShowBuyNow(false)}
          onSuccess={() => { setShowBuyNow(false); router.push("/buyer/orders"); }}
        />
      )}
    </article>
  );
}
