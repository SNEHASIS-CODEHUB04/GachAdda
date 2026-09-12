"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { useCartStore, type CartItem } from "@/stores/cart-store";

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, total, itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-primary-dark">Shopping Cart 🛒</h1>
        <EmptyState icon="🛒" title="Your cart is empty" description="Add plants from the marketplace to get started." action={{ label: "Shop Now", onClick: () => window.location.href = "/marketplace" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary-dark">Shopping Cart ({itemCount})</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-white rounded-xl shadow-card border border-[var(--border)] p-4">
            <div className="h-16 w-16 rounded-lg bg-cream overflow-hidden flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
              ) : <div className="flex h-full items-center justify-center text-2xl">🌿</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary-dark text-sm line-clamp-1">{item.name}</p>
              <p className="text-sm text-primary font-bold">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, item.quantity - 1)} className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-cream" aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.quantity + 1)} className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-cream" aria-label="Increase quantity"><Plus className="h-3 w-3" /></button>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary text-sm">{formatCurrency(item.price * item.quantity)}</p>
              <button onClick={() => removeItem(item.id)} className="text-xs text-error hover:underline mt-1 flex items-center gap-0.5" aria-label={`Remove ${item.name}`}><Trash2 className="h-3 w-3" /> Remove</button>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--color-sage)]">Subtotal</span><span>{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-sage)]">Delivery</span><span className="text-[var(--color-sage)]">Calculated at checkout</span></div>
        </CardBody>
        <CardFooter>
          <p className="font-bold text-base">Total</p>
          <p className="font-bold text-xl text-primary">{formatCurrency(total)}</p>
        </CardFooter>
      </Card>

      <div className="flex gap-3">
        <Link href="/buyer/checkout" className="flex-1">
          <Button className="w-full" size="lg" leftIcon={<ShoppingBag className="h-4 w-4" />}>Proceed to Checkout</Button>
        </Link>
        <Button variant="outline" size="lg" onClick={clearCart}>Clear Cart</Button>
      </div>
    </div>
  );
}
