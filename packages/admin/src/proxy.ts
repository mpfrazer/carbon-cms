import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (session) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }
    if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*"] };
