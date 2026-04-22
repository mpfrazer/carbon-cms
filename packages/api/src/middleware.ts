import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith("/api/v1");
  if (!isApiRoute) return NextResponse.next();

  // Credential validation endpoint is public (used by admin auth.js)
  if (pathname === "/api/v1/auth/login") return NextResponse.next();

  // Trusted server-to-server calls from admin/frontend packages bypass JWT auth.
  const internalSecret = req.headers.get("x-carbon-internal");
  if (internalSecret && internalSecret === process.env.CARBON_INTERNAL_SECRET) {
    return NextResponse.next();
  }

  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/v1/:path*"],
};
