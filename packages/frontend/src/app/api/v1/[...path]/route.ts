import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_URL = process.env.CARBON_API_URL ?? "http://localhost:3001";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const { path } = await params;
  const url = `${API_URL}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  // Only attach the internal service credential (Bearer AUTH_SECRET +
  // X-User-Role) when the incoming caller has an authenticated session.
  // Attaching it unconditionally was a confused-deputy: the API side
  // treats it as admin-proxy identity and skips its auth gate, so
  // unauth callers would reach protected /api/v1/* routes through this
  // proxy (A1 in the upstream audit). For unauth callers, forward the
  // incoming Authorization header (if any) so API-key callers still
  // work, and let the API's own edge proxy handle public-path / gating.
  const headers: Record<string, string> = {};
  if (session?.user?.id) {
    headers["Authorization"] = `Bearer ${process.env.AUTH_SECRET}`;
    headers["X-User-Id"] = session.user.id;
    headers["X-User-Role"] = (session.user as { role?: string }).role ?? "subscriber";
  } else {
    const incomingAuth = req.headers.get("authorization");
    if (incomingAuth) headers["Authorization"] = incomingAuth;
  }

  const contentType = req.headers.get("content-type");
  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (contentType?.includes("multipart/form-data")) {
      body = await req.formData();
    } else {
      const text = await req.text();
      if (text) {
        body = text;
        headers["Content-Type"] = contentType ?? "application/json";
      }
    }
  }

  const res = await fetch(url, { method: req.method, headers, body });
  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
