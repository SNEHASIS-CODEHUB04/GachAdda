import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BUYER_PATHS  = ["/buyer"];
const SELLER_PATHS = ["/seller"];
const AUTH_PATHS   = ["/login", "/register"];

export default auth(function proxy(req: NextRequest & { auth: { user?: { role: string } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Redirect authenticated users away from login/register
  if (session?.user && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const dest = session.user.role === "SELLER" ? "/seller/dashboard" : "/buyer/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Protect buyer routes
  if (BUYER_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
    }
    if (session.user.role !== "BUYER") {
      return NextResponse.redirect(new URL("/seller/dashboard", req.url));
    }
  }

  // Protect seller routes
  if (SELLER_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
    }
    if (session.user.role !== "SELLER") {
      return NextResponse.redirect(new URL("/buyer/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};