import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = { title: "My Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");

  const wishlist = await db.wishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          seller: { select: { id: true, name: true, sellerProfile: { select: { shopName: true } } } },
          category: { select: { name: true, emoji: true, slug: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary-dark">My Wishlist ❤️</h1>
      {wishlist.length === 0 ? (
        <EmptyState icon="❤️" title="No saved plants yet" description="Tap the heart icon on any plant to save it here." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((w) => (
            <ProductCard key={w.id} product={{ ...w.product, stock: w.product.stock }} isWishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
