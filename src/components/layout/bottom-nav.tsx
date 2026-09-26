"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Search, ShoppingBag, MessageCircle, User,
  Package, BarChart2, Bell, ShoppingCart, Heart,
  Send, FileText, Star, Settings, Tag,
  Users, CreditCard, Menu, X,
  CheckCircle, MessageSquare, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const buyerMain = [
  { href: "/buyer/dashboard",  label: "Home",    icon: LayoutDashboard },
  { href: "/marketplace",      label: "Shop",    icon: Search },
  { href: "/buyer/cart",       label: "Cart",    icon: ShoppingCart },
  { href: "/buyer/orders",     label: "Orders",  icon: ShoppingBag },
  { href: "/buyer/profile",    label: "Profile", icon: User },
];

const buyerMore = [
  { href: "/buyer/wishlist",      label: "Wishlist",      icon: Heart },
  { href: "/buyer/requests",      label: "My Requests",   icon: Send },
  { href: "/buyer/offers",        label: "Offers",        icon: Tag },
  { href: "/buyer/messages",      label: "Messages",      icon: MessageCircle },
  { href: "/buyer/notifications", label: "Notifications", icon: Bell },
  { href: "/buyer/invoices",      label: "Invoices",      icon: FileText },
  { href: "/buyer/reviews",       label: "My Reviews",    icon: Star },
  { href: "/buyer/settings",      label: "Settings",      icon: Settings },
];

const sellerMain = [
  { href: "/seller/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/seller/products",  label: "Products",icon: Package },
  { href: "/seller/orders",    label: "Orders",  icon: ShoppingBag },
  { href: "/seller/messages",  label: "Chat",    icon: MessageCircle },
  { href: "/seller/payment-verification", label: "Payments", icon: CreditCard },
];

const sellerMore = [
  { href: "/seller/analytics",         label: "Analytics",        icon: BarChart2 },
  { href: "/seller/buyer-requests",    label: "Buyer Requests",   icon: Users },
  { href: "/seller/discount-requests", label: "Discount Requests",icon: Tag },
  { href: "/seller/offers",            label: "My Offers",        icon: CheckCircle },
  { href: "/seller/questions",         label: "Questions",        icon: MessageSquare },
  { href: "/seller/notifications",     label: "Notifications",    icon: Bell },
  { href: "/seller/sales-history",     label: "Sales History",    icon: TrendingUp },
  { href: "/seller/invoices",          label: "Invoices",         icon: FileText },
  { href: "/seller/reviews",           label: "Reviews",          icon: Star },
  { href: "/seller/profile",           label: "Profile",          icon: User },
  { href: "/seller/settings",          label: "Settings",         icon: Settings },
];

export function BottomNav({ role }: { role: "buyer" | "seller" }) {
  const pathname = usePathname();
  const mainItems = role === "seller" ? sellerMain : buyerMain;
  const moreItems = role === "seller" ? sellerMore : buyerMore;
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* More drawer backdrop */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* More drawer */}
      <div className={`lg:hidden fixed bottom-16 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-[var(--border)] transition-transform duration-300 ${moreOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--border)]">
          <p className="font-semibold text-primary-dark text-sm">More</p>
          <button onClick={() => setMoreOpen(false)} className="p-1 text-[var(--color-sage)] hover:text-primary-dark">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-0 pb-6 pt-2 max-h-64 overflow-y-auto">
          {moreItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 hover:bg-cream/60 rounded-lg mx-1"
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-[var(--color-sage)]")} />
                <span className={cn("text-[9px] font-medium text-center leading-tight", active ? "text-primary" : "text-[var(--color-sage)]")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--border)] shadow-card-lg"
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16">
          {mainItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 px-2 py-2 min-w-[52px]"
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-[var(--color-sage)]")} />
                <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-[var(--color-sage)]")}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="flex flex-col items-center gap-1 px-2 py-2 min-w-[52px]"
            aria-label="More navigation options"
          >
            <Menu className={cn("h-5 w-5", moreOpen ? "text-primary" : "text-[var(--color-sage)]")} />
            <span className={cn("text-[10px] font-medium", moreOpen ? "text-primary" : "text-[var(--color-sage)]")}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
