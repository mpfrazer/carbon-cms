import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_GET_PREFIXES = [
  "/api/v1/posts",
  "/api/v1/pages",
  "/api/v1/categories",
  "/api/v1/tags",
  "/api/v1/settings",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (session) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }
    if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  // API route protection — public reads on content endpoints, auth required for writes and sensitive routes
  if (pathname.startsWith("/api/v1")) {
    if (pathname === "/api/v1/auth/login") return NextResponse.next();
    if (req.method === "GET" && PUBLIC_GET_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/v1/:path*"],
};
