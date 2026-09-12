import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  shopName: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid form data");
  }

  const { name, email, phone, password, role, shopName } = parsed.data;

  // Phone length check if provided
  if (phone && (phone.length < 10 || phone.length > 15)) {
    return err("Phone number must be between 10 and 15 digits");
  }

  // If seller, ensure shopName is valid or fallback to name's nursery
  let resolvedShopName: string | undefined = undefined;
  if (role === "SELLER") {
    if (shopName && shopName.length < 2) {
      return err("Shop name must be at least 2 characters");
    }
    resolvedShopName = shopName && shopName.length >= 2 ? shopName : `${name}'s Nursery`;
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });
  if (existing) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      return err("An account with this email already exists", 409);
    }
    return err("An account with this phone number already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role,
      sellerProfile: role === "SELLER"
        ? { create: { shopName: resolvedShopName! } }
        : undefined,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return ok({ user }, 201);
}
