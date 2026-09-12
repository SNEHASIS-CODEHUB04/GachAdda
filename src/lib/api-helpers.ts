import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/constants";

/** Require an authenticated session; returns user or a 401 Response */
export async function requireAuth(role?: UserRole) {
  const session = await auth();
  if (!session?.user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (role && session.user.role !== role) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user: session.user, error: null };
}

/** Standard JSON success response */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Standard JSON error response */
export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse pagination query params */
export function parsePagination(url: URL, defaultSize = 12) {
  const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1", 10));
  const limit = Math.min(48, parseInt(url.searchParams.get("limit") ?? String(defaultSize), 10));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}
