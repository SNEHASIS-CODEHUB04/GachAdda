import Link from "next/link";
import { Leaf } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      {/* Auth header */}
      <header className="py-5 px-6 flex justify-center">
        <Link href="/" className="flex items-center gap-2.5" aria-label="GachAdda home">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-primary-dark">{BRAND.name}</p>
            <p className="text-xs text-sage font-bengali leading-none">{BRAND.namebn}</p>
          </div>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="py-4 text-center text-xs text-[var(--color-sage)]">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </footer>
    </div>
  );
}
