import Link from "next/link";
import { Leaf, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { BRAND, CATEGORIES } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary-dark text-white/80" aria-label="Footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="GachAdda home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{BRAND.name}</p>
                <p className="text-xs text-sage font-bengali">{BRAND.namebn}</p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-white/60 mb-5">
              {BRAND.taglineEn}
            </p>
            {/* Social */}
            <div className="flex gap-3" aria-label="Social media links">
              {Object.entries(BRAND.social).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 hover:bg-primary hover:text-white transition-colors capitalize"
                >
                  {name[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Shop categories */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/marketplace?category=${cat.slug}`}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span aria-hidden="true">{cat.emoji}</span>
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              {[
                { href: "/community",       label: "Community Feed" },
                { href: "/blog",            label: "Plant-Care Blog" },
                { href: "/gallery",         label: "Photo Gallery" },
                { href: "/about",           label: "About Us" },
                { href: "/contact",         label: "Contact" },
                { href: "/terms",           label: "Terms & Conditions" },
                { href: "/return-policy",   label: "Return Policy" },
                { href: "/privacy",         label: "Privacy Policy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-sage shrink-0 mt-0.5" aria-hidden="true" />
                <span>{BRAND.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-sage" aria-hidden="true" />
                <a href={`tel:${BRAND.phone}`} className="hover:text-white transition-colors">
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-sage" aria-hidden="true" />
                <a href={`mailto:${BRAND.email}`} className="hover:text-white transition-colors">
                  {BRAND.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>© {year} {BRAND.name}. All rights reserved.</p>
          <p className="font-bengali">{BRAND.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
