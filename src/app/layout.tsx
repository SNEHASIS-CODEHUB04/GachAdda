import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/constants";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:  `${BRAND.name} — Plant Community & Marketplace`,
    template: `%s | ${BRAND.name}`,
  },
  description: `${BRAND.taglineEn} Shop plants, seeds, pots and more. Join the GachAdda plant community.`,
  keywords:    ["plants", "nursery", "indoor plants", "seeds", "buy plants online", "গাছ", "plant shop India"],
  authors:     [{ name: "Snehasis Dutta" }],
  metadataBase: new URL("https://gachadda.com"),
  openGraph: {
    type:        "website",
    siteName:    BRAND.name,
    title:       `${BRAND.name} — Plant Community & Marketplace`,
    description: BRAND.taglineEn,
  },
  twitter: {
    card:  "summary_large_image",
    title: `${BRAND.name} — Plant Community & Marketplace`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        {/* Preconnect to Google Fonts for Bengali typeface (loaded via CSS @import on demand) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh bg-cream font-inter antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
