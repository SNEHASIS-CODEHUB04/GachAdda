/** GachAdda brand constants */

export const BRAND = {
  name: "GachAdda",
  namebn: "গাছআড্ডা",
  tagline: "গাছ নিয়ে আড্ডা, সবুজে ভরা জীবন",
  taglineEn: "Chatting about plants, a life full of green.",
  url: "https://gachadda.com",
  email: "suman.paul.botanomaniac@gmail.com",
  phone: "+91 70012 74562",
  whatsapp: "+917001274562",
  address: "Kapasdanga, Gayeshpur, Burwan, Murshidabad — 742147, West Bengal, India",
  seller: {
    name: "Suman Paul",
    shopName: "Botanomaniac",
    instagram: "https://www.instagram.com/botanomaniac.i.am",
    facebook:  "https://www.facebook.com/share/1Du4H71tiC/",
    whatsapp:  "+917001274562",
    address:   "Kapasdanga, Gayeshpur, PO: Gayespur, Sub District: Burwan, District: Murshidabad, West Bengal — 742147",
  },
  social: {
    instagram: "https://www.instagram.com/botanomaniac.i.am",
    facebook:  "https://www.facebook.com/share/1Du4H71tiC/",
  },
} as const;

export const CATEGORIES = [
  { slug: "indoor-plants",        label: "Indoor Plants",          emoji: "🪴", labelBn: "ইনডোর গাছ" },
  { slug: "flower-plants",        label: "Flower Plants",          emoji: "🌸", labelBn: "ফুলের গাছ" },
  { slug: "fruit-herb-plants",    label: "Fruit & Herb Plants",    emoji: "🌿", labelBn: "ফল ও হার্ব গাছ" },
  { slug: "trees-palms",          label: "Trees & Palms",          emoji: "🌴", labelBn: "গাছ ও পাম" },
  { slug: "seeds-bulbs",          label: "Seeds & Bulbs",          emoji: "🌱", labelBn: "বীজ ও বাল্ব" },
  { slug: "pots-planters",        label: "Pots & Planters",        emoji: "🏺", labelBn: "টব ও প্ল্যান্টার" },
  { slug: "fertilizer-tools",     label: "Fertilizer & Tools",     emoji: "🧪", labelBn: "সার ও সরঞ্জাম" },
  { slug: "water-plants",         label: "Water Plants",           emoji: "💧", labelBn: "জলের গাছ" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const ORDER_STATUSES = [
  "PAYMENT_PENDING",
  "PAYMENT_VERIFICATION",
  "PAYMENT_VERIFIED",
  "ORDER_ACCEPTED",
  "PROCESSING",
  "PACKED",
  "DISPATCHED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING:       "Payment Pending",
  PAYMENT_VERIFICATION:  "Verifying Payment",
  PAYMENT_VERIFIED:      "Payment Verified",
  ORDER_ACCEPTED:        "Order Accepted",
  PROCESSING:            "Processing",
  PACKED:                "Packed",
  DISPATCHED:            "Dispatched",
  DELIVERED:             "Delivered",
  COMPLETED:             "Completed",
  CANCELLED:             "Cancelled",
  REJECTED:              "Rejected",
};

export const DELIVERY_TIMELINE: OrderStatus[] = [
  "PAYMENT_VERIFIED",
  "ORDER_ACCEPTED",
  "PROCESSING",
  "PACKED",
  "DISPATCHED",
  "DELIVERED",
];

export const REQUEST_STATUSES = ["OPEN", "RESPONDED", "ACCEPTED", "CLOSED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const OFFER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "COUNTERED"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ROLES = ["BUYER", "SELLER"] as const;
export type UserRole = (typeof ROLES)[number];

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE:     48,
} as const;

export const MAX_COMPARE_ITEMS = 4;
export const MAX_CART_QTY = 99;
export const MIN_REVIEW_CHARS = 20;
export const MAX_IMAGES_PER_PRODUCT = 6;

/** Notification event types */
export const NOTIFICATION_EVENTS = {
  NEW_REQUEST_REPLY:  "🌱 Your plant request got a response",
  DISCOUNT_OFFER:     "💰 You received a discount offer",
  PAYMENT_VERIFIED:   "💳 Your payment has been verified",
  ORDER_DISPATCHED:   "📦 Your order has been dispatched",
  NEW_MESSAGE:        "💬 New message from",
  NEW_REVIEW:         "⭐ New review received",
  NEW_REQUEST:        "📩 New plant request received",
  PAYMENT_SUBMITTED:  "💳 Buyer submitted payment proof",
  STATUS_REMINDER:    "📦 Order status update required",
} as const;
