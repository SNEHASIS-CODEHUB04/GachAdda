"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id:       string;
  sellerId: string;
  name:     string;
  price:    number;
  image:    string | null;
  quantity: number;
  slug:     string;
  stock:    number; // max qty buyer can add
}

interface CartStore {
  items:      CartItem[];
  addItem:    (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQty:  (id: string, qty: number) => void;
  clearCart:  () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const exists = state.items.find((i) => i.id === item.id);
          if (exists) {
            // Don't exceed available stock
            const newQty = Math.min(exists.quantity + 1, item.stock ?? 999);
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => {
          if (qty <= 0) return { items: state.items.filter((i) => i.id !== id) };
          return {
            items: state.items.map((i) => {
              if (i.id !== id) return i;
              // Clamp to available stock
              const clamped = Math.min(qty, i.stock ?? 999);
              return { ...i, quantity: clamped };
            }),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    { name: "gachadda-cart" }
  )
);

// Derived selectors — computed fresh each render, always accurate
export const cartTotal     = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);
export const cartItemCount = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);
