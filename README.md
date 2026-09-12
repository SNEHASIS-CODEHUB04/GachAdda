# গাছআড্ডা — GachAdda

> **গাছ নিয়ে আড্ডা, সবুজে ভরা জীবন** — Chatting about plants, a life full of green.

A full-stack plant community & marketplace platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma** and **PostgreSQL**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SNEHASIS-CODEHUB04/GachAdda)

---

## ✨ Features

| Area | Features |
|------|----------|
| **Auth** | Email/OTP login, Buyer & Seller roles, NextAuth v5 sessions |
| **Marketplace** | Product browse, search, filter, sort, pagination |
| **Product Details** | Gallery, care info, seller profile, reviews |
| **Buyer Requests** | Post custom requests, receive seller offers |
| **Negotiation** | Discount negotiation thread with Accept/Reject/Counter |
| **Cart & Checkout** | Seller-grouped cart, address selection, order summary |
| **QR / UPI Payment** | Manual payment proof submission (screenshot + TxID) |
| **Payment Verification** | Seller verifies/rejects payment proofs |
| **Order Lifecycle** | 6-step delivery timeline with real-time status push |
| **Invoices** | Auto-generated PDF invoice per order |
| **Real-time Chat** | Buyer ↔ Seller messaging with product/order references |
| **Notifications** | Grouped, timestamped, read/unread notification centre |
| **Community Feed** | Instagram-style posts with like, comment, share |
| **Blog & Gallery** | Bilingual (Bengali/English) plant-care articles & photos |
| **Reviews** | 1–5 star rating + review body + seller reply |
| **Wishlist & Compare** | Save & compare up to 4 products |
| **Analytics** | Seller KPI dashboard with sales charts |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom design tokens |
| Database | PostgreSQL via **Prisma ORM** (Neon / Vercel Postgres) |
| Auth | **NextAuth.js v5** (Credentials, JWT sessions) |
| Real-time | **Pusher** (chat & notifications) |
| Storage | Vercel Blob / Cloudinary |
| Email | Resend |
| State | Zustand (cart), TanStack Query (server state) |
| Validation | Zod + React Hook Form |
| Hosting | **Vercel** |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended for Vercel)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/SNEHASIS-CODEHUB04/GachAdda.git
cd GachAdda

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, PUSHER_*, CLOUDINARY_* etc.

# 4. Push the Prisma schema to your DB
npx prisma db push

# 5. (Optional) Seed categories
npx prisma db seed

# 6. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (public)/        # Landing, Marketplace, Products, Community, Blog
│   ├── (buyer)/         # Buyer dashboard, orders, cart, wishlist, messages
│   ├── (seller)/        # Seller dashboard, analytics, products, orders
│   └── api/             # Route handlers (REST API)
├── components/
│   ├── ui/              # Design system: Button, Card, Input, Modal, Toast…
│   ├── layout/          # Navbar, Footer, Sidebar, BottomNav
│   ├── product/         # ProductCard, ProductGrid
│   └── chat/            # ConversationList, ChatWindow
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma singleton
│   ├── utils.ts         # Helpers (cn, formatCurrency, timeAgo…)
│   ├── constants.ts     # Brand tokens, categories, order statuses
│   └── api-helpers.ts   # requireAuth, ok, err, parsePagination
├── stores/
│   └── cart-store.ts    # Zustand persisted cart
└── middleware.ts         # Auth & role-based route protection
prisma/
└── schema.prisma         # Full database schema
```

---

## 🎨 Design System

Brand tokens defined as CSS custom properties in `globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#2E7D46` | Buttons, links, active states |
| `--color-primary-dark` | `#1F4D2C` | Headings, navbar, footer |
| `--color-sage` | `#8FA88A` | Secondary surfaces, muted text |
| `--color-cream` | `#F6F1E7` | Page & card backgrounds |
| `--color-earth` | `#8A5A3B` | Secondary CTAs |
| `--color-gold` | `#C9A94D` | Ratings, verified badges |

---

## 📄 License

MIT © 2026 Snehasis Dutta
