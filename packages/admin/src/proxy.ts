import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (
      pathname === "/admin/login" ||
      pathname === "/admin/setup" ||
      pathname === "/admin/forgot-password" ||
      pathname === "/admin/reset-password"
    ) {
      if (session) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }
    const role = (session?.user as { role?: string })?.role;
    if (!session || role === "subscriber") return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*"] };
