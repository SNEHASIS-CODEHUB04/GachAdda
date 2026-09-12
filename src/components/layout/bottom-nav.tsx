"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, ShoppingBag, MessageCircle, User,
  Package, BarChart2, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const buyerItems = [
  { href: "/buyer/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/marketplace",     label: "Shop",     icon: Search },
  { href: "/buyer/orders",    label: "Orders",   icon: ShoppingBag },
  { href: "/buyer/messages",  label: "Chat",     icon: MessageCircle },
  { href: "/buyer/profile",   label: "Profile",  icon: User },
];

const sellerItems = [
  { href: "/seller/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/seller/analytics", label: "Analytics",icon: BarChart2 },
  { href: "/seller/orders",    label: "Orders",   icon: Package },
  { href: "/seller/messages",  label: "Chat",     icon: MessageCircle },
  { href: "/seller/notifications", label: "Alerts", icon: Bell },
];

export function BottomNav({ role }: { role: "buyer" | "seller" }) {
  const pathname = usePathname();
  const items = role === "seller" ? sellerItems : buyerItems;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--border)] shadow-card-lg"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-1 px-3 py-2 min-w-[56px]"
            >
              <Icon
                className={cn("h-5 w-5", active ? "text-primary" : "text-[var(--color-sage)]")}
                aria-hidden="true"
              />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-[var(--color-sage)]")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
