import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Published content and site settings are publicly readable — no auth required for GET.
// Write operations and sensitive endpoints (users, media, AI) always require auth.
const PUBLIC_GET_PREFIXES = [
  "/api/v1/posts",
  "/api/v1/pages",
  "/api/v1/categories",
  "/api/v1/tags",
  "/api/v1/settings",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/v1")) return NextResponse.next();

  // Credential validation is public (used by admin auth.js)
  if (pathname === "/api/v1/auth/login") return NextResponse.next();

  // Public read access for content and settings
  if (req.method === "GET" && PUBLIC_GET_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Trusted server-to-server calls from admin/frontend packages
  const internalSecret = req.headers.get("x-carbon-internal");
  if (
    internalSecret &&
    process.env.CARBON_INTERNAL_SECRET &&
    internalSecret === process.env.CARBON_INTERNAL_SECRET
  ) {
    return NextResponse.next();
  }

  // JWT auth for all other routes — use getToken so a missing AUTH_SECRET
  // returns null rather than throwing a 500.
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
