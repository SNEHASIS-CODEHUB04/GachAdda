"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart, Heart, Bell, Search, Menu, X,
  User, LogOut, LayoutDashboard, Package, Settings,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BRAND, CATEGORIES } from "@/lib/constants";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 bg-primary-dark shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="GachAdda home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <span className="block text-lg font-bold text-white leading-none">
                {BRAND.name}
              </span>
              <span className="block text-[11px] text-sage-light font-bengali leading-none">
                {BRAND.namebn}
              </span>
            </div>
          </Link>

          {/* Search bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <form action="/marketplace" className="relative w-full" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Search plants, seeds, pots…"
                className="w-full rounded-lg bg-white/10 border border-white/20 pl-9 pr-4 py-2 text-sm text-white placeholder:text-sage focus:outline-none focus:ring-2 focus:ring-gold"
                aria-label="Search marketplace"
              />
            </form>
          </div>

          {/* Actions */}
          <nav className="flex items-center gap-1" aria-label="Header actions">
            {/* Mobile search */}
            <button
              className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Toggle search"
              aria-expanded={searchOpen}
            >
              <Search className="h-5 w-5" />
            </button>

            {user ? (
              <>
                {/* Cart (buyers only) */}
                {user.role === "BUYER" && (
                  <Link
                    href="/buyer/cart"
                    className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Shopping cart"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                )}

                {/* Wishlist */}
                {user.role === "BUYER" && (
                  <Link
                    href="/buyer/wishlist"
                    className="hidden sm:flex p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Wishlist"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                )}

                {/* Notifications */}
                <Link
                  href={user.role === "SELLER" ? "/seller/notifications" : "/buyer/notifications"}
                  className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Link>

                {/* Avatar menu */}
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="gold" size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-1 p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>

        {/* Category nav strip (desktop) */}
        <div className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/marketplace?category=${cat.slug}`}
              className="shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span aria-hidden="true">{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <form action="/marketplace" role="search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  placeholder="Search plants, seeds, pots…"
                  autoFocus
                  className="w-full rounded-lg bg-white/10 border border-white/20 pl-9 pr-4 py-2 text-sm text-white placeholder:text-sage focus:outline-none focus:ring-2 focus:ring-gold"
                  aria-label="Search marketplace"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-white/10 bg-primary-dark">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Categories</p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/marketplace?category=${cat.slug}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <span aria-hidden="true">{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
              <Link href="/community" className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => setMenuOpen(false)}>
                🌿 Community
              </Link>
              <Link href="/blog" className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => setMenuOpen(false)}>
                📖 Blog
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu({ user }: { user: { name: string; email: string; role: string; image: string | null } }) {
  const [open, setOpen] = useState(false);
  const dashLink = user.role === "SELLER" ? "/seller/dashboard" : "/buyer/dashboard";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.image ? (
          <Image src={user.image} alt={user.name} width={32} height={32} className="rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
            {user.name[0].toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block text-sm text-white/90 max-w-[120px] truncate">{user.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl bg-white shadow-card-lg border border-[var(--border)] py-1 animate-fade-in"
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-primary-dark truncate">{user.name}</p>
              <p className="text-xs text-[var(--color-sage)] truncate">{user.email}</p>
            </div>
            <MenuLink href={dashLink} icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onClick={() => setOpen(false)} />
            {user.role === "BUYER" && <MenuLink href="/buyer/orders" icon={<Package className="h-4 w-4" />} label="My Orders" onClick={() => setOpen(false)} />}
            {user.role === "SELLER" && <MenuLink href="/seller/products" icon={<Package className="h-4 w-4" />} label="My Products" onClick={() => setOpen(false)} />}
            <MenuLink
              href={user.role === "SELLER" ? "/seller/profile" : "/buyer/profile"}
              icon={<User className="h-4 w-4" />}
              label="Profile"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href={user.role === "SELLER" ? "/seller/settings" : "/buyer/settings"}
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
              onClick={() => setOpen(false)}
            />
            <div className="border-t border-[var(--border)] mt-1 pt-1">
              <button
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href, icon, label, onClick,
}: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-3 px-4 py-2 text-sm text-primary-dark hover:bg-primary/5 transition-colors"
      onClick={onClick}
    >
      <span className="text-[var(--color-sage)]">{icon}</span>
      {label}
    </Link>
  );
}
