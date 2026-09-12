"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingCart, Heart, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";
import { QuickPayModal } from "@/components/quick-pay-modal";

interface ProductActionsProps {
  product: {
    id: string;
    slug: string;
    name: string;
    finalPrice: number;
    images: string[];
    stockStatus: string;
    stock: number;
    seller: { id: string; name: string };
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const { data: session } = useSession();
  const { addItem } = useCartStore();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const isSeller = session?.user?.id === product.seller.id;
  const [showBuyNow, setShowBuyNow] = useState(false);

  // Don't show buyer actions if viewing own product as seller
  if (isSeller) {
    return (
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">👋 You are viewing your own product. Buyers will see add to cart and chat options here.</p>
      </div>
    );
  }

  function handleAddToCart() {
    if (!session?.user) { router.push(`/login?callbackUrl=/products/${product.slug}`); return; }
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
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  async function handleWishlist() {
    if (!session?.user) { router.push(`/login?callbackUrl=/products/${product.slug}`); return; }
    const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
    if (res.ok) { const d = await res.json(); setWishlisted(d.wishlisted); success(d.wishlisted ? "Saved to wishlist ❤️" : "Removed from wishlist"); }
  }

  async function handleChat() {
    if (!session?.user) { router.push(`/login?callbackUrl=/products/${product.slug}`); return; }
    setChatLoading(true);
    const res = await fetch("/api/conversations/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId: product.seller.id }) });
    const data = await res.json();
    setChatLoading(false);
    if (!res.ok) { showError("Could not start chat"); return; }
    router.push(`/buyer/messages/${data.conversationId}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <Button size="lg" disabled={outOfStock} className="flex-1 sm:flex-none" leftIcon={<ShoppingCart className="h-4 w-4" />} onClick={handleAddToCart}>
        {outOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
      </Button>
      {!outOfStock && (
        <Button size="lg" variant="primary" leftIcon={<Zap className="h-4 w-4" />} onClick={() => {
          if (!session?.user) { router.push(`/login?callbackUrl=/products/${product.slug}`); return; }
          setShowBuyNow(true);
        }}>
          Buy Now
        </Button>
      )}
      <Button variant="outline" size="lg" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={handleChat} loading={chatLoading}>
        Chat with Seller
      </Button>
      <Button variant="ghost" size="icon" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} onClick={handleWishlist}>
        <Heart className={`h-5 w-5 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </Button>

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
    </div>
  );
}
