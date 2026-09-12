"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { useCartStore, cartTotal, cartItemCount, type CartItem } from "@/stores/cart-store";
import { QuickPayModal } from "@/components/quick-pay-modal";

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total     = cartTotal(items);
  const itemCount = cartItemCount(items);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-primary-dark">Shopping Cart 🛒</h1>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Add plants from the marketplace to get started."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary-dark">Shopping Cart ({itemCount})</h1>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item: CartItem) => (
          <div key={item.id} className="flex items-center gap-4 bg-white rounded-xl shadow-card border border-[var(--border)] p-4">
            <div className="h-16 w-16 rounded-lg bg-cream overflow-hidden flex-shrink-0">
              {item.image
                ? <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                : <div className="flex h-full items-center justify-center text-2xl">🌿</div>
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary-dark text-sm line-clamp-1">{item.name}</p>
              <p className="text-sm text-primary font-bold">{formatCurrency(item.price)}</p>
              {item.stock <= 5 && (
                <p className="text-xs text-amber-600 mt-0.5">Only {item.stock} left in stock</p>
              )}
            </div>

            {/* Qty controls — capped at stock */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, item.quantity - 1)}
                className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-cream disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-cream disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold text-primary text-sm">{formatCurrency(item.price * item.quantity)}</p>
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs text-error hover:underline mt-1 flex items-center gap-0.5"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          {items.map((item: CartItem) => (
            <div key={item.id} className="flex justify-between text-[var(--color-sage)]">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1 border-t border-[var(--border)]">
            <span className="text-[var(--color-sage)]">Subtotal</span>
            <span className="font-semibold text-primary-dark">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-sage)]">Delivery</span>
            <span className="text-success font-medium">Free</span>
          </div>
        </CardBody>
        <CardFooter>
          <p className="font-bold text-base text-primary-dark">Total</p>
          <p className="font-bold text-xl text-primary">{formatCurrency(total)}</p>
        </CardFooter>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          size="lg"
          onClick={() => setShowPayModal(true)}
        >
          💳 Pay Now — {formatCurrency(total)}
        </Button>
        <Button variant="outline" size="lg" onClick={clearCart}>Clear Cart</Button>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <QuickPayModal
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setShowPayModal(false);
            router.push("/buyer/orders");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
