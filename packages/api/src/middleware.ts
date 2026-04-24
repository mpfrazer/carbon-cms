import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 60_000; // 1 minute

// Requests/min limits
const LIMIT_GENERAL = 120;
const LIMIT_AUTH = 10;
const LIMIT_API_KEY = 600;

const AUTH_PATTERNS = [
  /^\/api\/v1\/auth\//,
  /^\/api\/v1\/users\/[^/]+\/reset-password/,
  /^\/api\/v1\/users\/[^/]+\/forgot-password/,
];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/v1/")) return NextResponse.next();

  const bearer = req.headers.get("authorization") ?? "";

  // Internal admin proxy — skip rate limiting
  if (bearer === `Bearer ${process.env.AUTH_SECRET}`) return NextResponse.next();

  let key: string;
  let limit: number;

  if (bearer.startsWith("Bearer csk_")) {
    // API key consumer — keyed by the key itself, higher limit
    key = `apikey:${bearer.slice(7, 19)}`; // use first 12 chars of key as bucket id
    limit = LIMIT_API_KEY;
  } else {
    const ip = getIp(req);
    const isAuthRoute = AUTH_PATTERNS.some((p) => p.test(pathname));
    key = `ip:${ip}:${isAuthRoute ? "auth" : "general"}`;
    limit = isAuthRoute ? LIMIT_AUTH : LIMIT_GENERAL;
  }

  const result = checkRateLimit(key, limit, WINDOW_MS);

  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(result.resetAt));

  if (!result.allowed) {
    headers.set("Retry-After", String(result.resetAt - Math.floor(Date.now() / 1000)));
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers }
    );
  }

  const res = NextResponse.next();
  headers.forEach((value, name) => res.headers.set(name, value));
  return res;
}

export const config = {
  matcher: "/api/v1/:path*",
};
