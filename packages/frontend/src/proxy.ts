import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED = ["/account"];
const AUTH_ONLY = ["/login", "/register"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
  }

  if (AUTH_ONLY.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
});

export const config = { matcher: ["/login", "/register", "/account/:path*"] };
