import { NextRequest, NextResponse } from "next/server";

const PUBLIC_GET_PREFIXES = [
  "/api/v1/posts",
  "/api/v1/pages",
  "/api/v1/categories",
  "/api/v1/tags",
  "/api/v1/settings",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/v1")) return NextResponse.next();
  if (pathname === "/api/v1/auth/login") return NextResponse.next();

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.AUTH_SECRET}`) return NextResponse.next();

  if (req.method === "GET" && PUBLIC_GET_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = { matcher: ["/api/v1/:path*"] };
