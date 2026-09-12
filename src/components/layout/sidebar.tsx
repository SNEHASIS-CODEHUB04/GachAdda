"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, CreditCard,
  MessageCircle, Bell, FileText, BarChart2,
  Users, Star, Settings, User, Heart,
  Send, Tag, Truck, BookOpen, Image,
  CheckCircle, Search, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
  badge?: number;
}

const buyerNav: NavItem[] = [
  { href: "/buyer/dashboard",     label: "Dashboard",       icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { href: "/marketplace",         label: "Marketplace",     icon: <Search         className="h-4.5 w-4.5" /> },
  { href: "/buyer/orders",        label: "My Orders",       icon: <ShoppingBag    className="h-4.5 w-4.5" /> },
  { href: "/buyer/cart",          label: "Cart",            icon: <Package        className="h-4.5 w-4.5" /> },
  { href: "/buyer/wishlist",      label: "Wishlist",        icon: <Heart          className="h-4.5 w-4.5" /> },
  { href: "/buyer/requests",      label: "My Requests",     icon: <Send           className="h-4.5 w-4.5" /> },
  { href: "/buyer/offers",        label: "Offers",          icon: <Tag            className="h-4.5 w-4.5" /> },
  { href: "/buyer/messages",      label: "Messages",        icon: <MessageCircle  className="h-4.5 w-4.5" /> },
  { href: "/buyer/notifications", label: "Notifications",   icon: <Bell           className="h-4.5 w-4.5" /> },
  { href: "/buyer/invoices",      label: "Invoices",        icon: <FileText       className="h-4.5 w-4.5" /> },
  { href: "/buyer/reviews",       label: "My Reviews",      icon: <Star           className="h-4.5 w-4.5" /> },
  { href: "/buyer/profile",       label: "Profile",         icon: <User           className="h-4.5 w-4.5" /> },
  { href: "/buyer/settings",      label: "Settings",        icon: <Settings       className="h-4.5 w-4.5" /> },
];

const sellerNav: NavItem[] = [
  { href: "/seller/dashboard",          label: "Dashboard",        icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
  { href: "/seller/analytics",          label: "Analytics",        icon: <BarChart2       className="h-4.5 w-4.5" /> },
  { href: "/seller/products",           label: "Products",         icon: <Package         className="h-4.5 w-4.5" /> },
  { href: "/seller/orders",             label: "Orders",           icon: <ShoppingBag     className="h-4.5 w-4.5" /> },
  { href: "/seller/payment-verification", label: "Verify Payments",icon: <CreditCard      className="h-4.5 w-4.5" /> },
  { href: "/seller/buyer-requests",     label: "Buyer Requests",   icon: <Users           className="h-4.5 w-4.5" /> },
  { href: "/seller/discount-requests",  label: "Discount Requests",icon: <Tag             className="h-4.5 w-4.5" /> },
  { href: "/seller/offers",             label: "My Offers",        icon: <CheckCircle     className="h-4.5 w-4.5" /> },
  { href: "/seller/messages",           label: "Messages",         icon: <MessageCircle   className="h-4.5 w-4.5" /> },
  { href: "/seller/questions",          label: "Questions",        icon: <MessageSquare   className="h-4.5 w-4.5" /> },
  { href: "/seller/notifications",      label: "Notifications",    icon: <Bell            className="h-4.5 w-4.5" /> },
  { href: "/seller/sales-history",      label: "Sales History",    icon: <Truck           className="h-4.5 w-4.5" /> },
  { href: "/seller/invoices",           label: "Invoices",         icon: <FileText        className="h-4.5 w-4.5" /> },
  { href: "/seller/community",          label: "Community",        icon: <Users           className="h-4.5 w-4.5" /> },
  { href: "/seller/blog",               label: "Blog & Gallery",   icon: <BookOpen        className="h-4.5 w-4.5" /> },
  { href: "/seller/reviews",            label: "Reviews",          icon: <Star            className="h-4.5 w-4.5" /> },
  { href: "/seller/profile",            label: "Profile",          icon: <User            className="h-4.5 w-4.5" /> },
  { href: "/seller/settings",           label: "Settings",         icon: <Settings        className="h-4.5 w-4.5" /> },
];

interface SidebarProps {
  role: "buyer" | "seller";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "seller" ? sellerNav : buyerNav;

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0">
      <nav className="flex flex-col gap-0.5 sticky top-20" aria-label={`${role} navigation`}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-primary-dark hover:bg-primary/8 hover:text-primary"
              )}
            >
              <span className={active ? "text-white" : "text-[var(--color-sage)]"} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
