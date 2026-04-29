import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseCorsOrigins, getCorsHeaders } from "@/lib/cors";

const WINDOW_MS = 60_000;
const LIMIT_GENERAL = 120;
const LIMIT_AUTH = 10;
const LIMIT_API_KEY = 600;

const AUTH_PATTERNS = [
  /^\/api\/v1\/auth\//,
  /^\/api\/v1\/users\/[^/]+\/reset-password/,
  /^\/api\/v1\/users\/[^/]+\/forgot-password/,
];

const PUBLIC_GET_PREFIXES = [
  "/api/v1/posts",
  "/api/v1/pages",
  "/api/v1/categories",
  "/api/v1/tags",
  "/api/v1/settings",
  "/api/v1/comments",
  "/api/v1/health",
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

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/v1") && !pathname.startsWith("/uploads")) {
    return NextResponse.next();
  }

  const allowedOrigins = parseCorsOrigins(process.env.CARBON_ALLOWED_ORIGINS);
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders as HeadersInit,
    });
  }

  // Uploads are served directly by the route handler — just attach CORS headers
  if (pathname.startsWith("/uploads")) {
    const res = NextResponse.next();
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const bearer = req.headers.get("authorization") ?? "";

  // Internal admin/frontend proxy — skip rate limiting and auth
  if (bearer === `Bearer ${process.env.AUTH_SECRET}`) {
    const res = NextResponse.next();
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Rate limiting
  let rlKey: string;
  let limit: number;

  if (bearer.startsWith("Bearer csk_")) {
    rlKey = `apikey:${bearer.slice(7, 19)}`;
    limit = LIMIT_API_KEY;
  } else {
    const ip = getIp(req);
    const isAuthRoute = AUTH_PATTERNS.some((p) => p.test(pathname));
    rlKey = `ip:${ip}:${isAuthRoute ? "auth" : "general"}`;
    limit = isAuthRoute ? LIMIT_AUTH : LIMIT_GENERAL;
  }

  const result = checkRateLimit(rlKey, limit, WINDOW_MS);
  const rlHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    ...corsHeaders,
  };

  if (!result.allowed) {
    rlHeaders["Retry-After"] = String(result.resetAt - Math.floor(Date.now() / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rlHeaders },
    );
  }

  // Authorization
  const isPublicAny = PUBLIC_ANY_PATHS.includes(pathname);
  const isPublicGet =
    req.method === "GET" && PUBLIC_GET_PREFIXES.some((p) => pathname.startsWith(p));
  const isApiKey = bearer.startsWith("Bearer csk_");

  if (!isPublicAny && !isPublicGet && !isApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: rlHeaders });
  }

  const res = NextResponse.next();
  Object.entries(rlHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: ["/api/v1/:path*", "/uploads/:path*"] };
