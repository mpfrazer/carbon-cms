import { NextRequest, NextResponse } from "next/server";

const PUBLIC_GET_PREFIXES = [
  "/api/v1/posts",
  "/api/v1/pages",
  "/api/v1/categories",
  "/api/v1/tags",
  "/api/v1/settings",
  "/api/v1/comments",
];

const PUBLIC_ANY_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/resend-verification",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/setup",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/v1")) return NextResponse.next();
  if (PUBLIC_ANY_PATHS.includes(pathname)) return NextResponse.next();

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.AUTH_SECRET}`) return NextResponse.next();

  if (req.method === "GET" && PUBLIC_GET_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = { matcher: ["/api/v1/:path*"] };
