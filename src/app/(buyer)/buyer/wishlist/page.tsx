"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface WishlistProduct {
  id: string;
  slug: string;
  name: string;
  finalPrice: number;
  price: number;
  discountPct: number;
  images: string[];
  stockStatus: string;
  stock: number;
  seller: { id: string; name: string; sellerProfile?: { shopName: string } | null };
  category: { name: string; emoji?: string | null };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.wishlist ?? []);
        setLoading(false);
      });
  }, []);

  async function removeFromWishlist(productId: string) {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((i) => i.id !== productId));
    success("Removed from wishlist");
  }

  function handleAddToCart(product: WishlistProduct) {
    if (product.stockStatus === "OUT_OF_STOCK") {
      showError("Out of stock");
      return;
    }
    addItem({
      id: product.id,
      sellerId: product.seller.id,
      name: product.name,
      price: product.finalPrice,
      image: product.images[0] ?? null,
      slug: product.slug,
      stock: product.stock ?? 99,
    });
    success(`${product.name} added to cart 🌿`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-primary-dark">My Wishlist</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-cream animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">My Wishlist</h1>
        <p className="text-sm text-[var(--color-sage)]">
          {items.length} saved plant{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <Heart className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">Your wishlist is empty</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">
              Save plants you love to buy them later
            </p>
            <Link href="/marketplace">
              <Button className="mt-4" size="sm">
                Browse Marketplace
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((product) => (
            <article
              key={product.id}
              className="bg-white rounded-xl shadow-card border border-[var(--border)] overflow-hidden"
            >
              <Link
                href={`/products/${product.slug}`}
                className="block relative h-44 bg-cream overflow-hidden"
              >
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width:640px) 50vw, 25vw"
                    className="object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
                    🌿
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(product.id);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow"
                  aria-label="Remove from wishlist"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </Link>
              <div className="p-3 space-y-2">
                <p className="text-xs text-[var(--color-sage)]">
                  {product.category.emoji} {product.category.name}
                </p>
                <Link href={`/products/${product.slug}`}>
                  <p className="text-sm font-semibold text-primary-dark line-clamp-2 hover:text-primary">
                    {product.name}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">
                    {formatCurrency(product.finalPrice)}
                  </span>
                  {product.discountPct > 0 && (
                    <span className="text-xs text-[var(--color-sage)] line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={product.stockStatus === "OUT_OF_STOCK"}
                  onClick={() => handleAddToCart(product)}
                  leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
                >
                  {product.stockStatus === "OUT_OF_STOCK" ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
