"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";

interface ProductGridProps {
  products: ProductCardData[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const { data: session } = useSession();
  const { addItem } = useCartStore();
  const { success, error: showError } = useToast();
  const router = useRouter();

  async function handleAddToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (!session?.user) {
      router.push("/login?callbackUrl=/marketplace");
      return;
    }

    addItem({
      id:       product.id,
      sellerId: product.seller.id,
      name:     product.name,
      price:    product.finalPrice,
      image:    product.images[0] ?? null,
      slug:     product.slug,
      stock:    product.stock ?? 99,
    });
    success(`${product.name} added to cart 🌿`);
  }

  async function handleWishlist(productId: string) {
    if (!session?.user) {
      router.push("/login?callbackUrl=/marketplace");
      return;
    }
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const data = await res.json();
      success(data.wishlisted ? "Added to wishlist ❤️" : "Removed from wishlist");
    } else {
      showError("Could not update wishlist");
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-5xl mb-4">🌱</p>
        <h2 className="text-xl font-semibold text-primary-dark">No plants found</h2>
        <p className="text-[var(--color-sage)] mt-2">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onWishlist={handleWishlist}
        />
      ))}
    </div>
  );
}
