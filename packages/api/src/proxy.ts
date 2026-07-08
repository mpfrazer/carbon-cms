import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseCorsOrigins, getCorsHeaders } from "@/lib/cors";
import { extractApiKeyToken, validateApiKey } from "@/lib/api-key";
import { hasAdminProxyAuth } from "@/lib/authz";

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

export async function proxy(req: NextRequest) {
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

  // Internal admin/frontend proxy — skip rate limiting and auth.
  //
  // The Bearer alone used to be sufficient to short-circuit here, which
  // paired with the admin/frontend proxies unconditionally attaching that
  // Bearer produced a confused-deputy: unauth callers reaching a proxy
  // would silently pass this gate (A1 in the upstream audit). Require
  // the X-User-Role: admin header alongside the Bearer so the caller
  // has to name itself as an admin identity, not just possess the secret.
  // The proxies (packages/{admin,frontend}/src/app/api/v1/[...path]/route.ts)
  // only attach that header when they have a session, so unauth traffic
  // now falls through to the public-path / API-key gates below.
  if (hasAdminProxyAuth(req.headers)) {
    const res = NextResponse.next();
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Validate API key tokens before doing anything else with them. An invalid
  // token must not get the API-key rate-limit bucket and must not pass the
  // authorization gate further down. Validation failures are billed against
  // the IP rate-limit bucket so they slow down brute-force guessing.
  const apiKeyToken = extractApiKeyToken(bearer);
  let validatedKeyId: string | null = null;
  if (apiKeyToken) {
    const validated = await validateApiKey(apiKeyToken);
    if (!validated) {
      const ip = getIp(req);
      const result = checkRateLimit(`ip:${ip}:general`, LIMIT_GENERAL, WINDOW_MS);
      const headers: Record<string, string> = {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
        ...corsHeaders,
      };
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401, headers },
      );
    }
    validatedKeyId = validated.id;
  }

  // Rate limiting
  let rlKey: string;
  let limit: number;

  if (validatedKeyId) {
    rlKey = `apikey:${validatedKeyId}`;
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

  if (!isPublicAny && !isPublicGet && !validatedKeyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: rlHeaders });
  }

  const res = NextResponse.next();
  Object.entries(rlHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: ["/api/v1/:path*", "/uploads/:path*"] };
