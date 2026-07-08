import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_URL = process.env.CARBON_API_URL ?? "http://localhost:3001";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const { path } = await params;
  const url = `${API_URL}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  // Only attach the admin-proxy service credential (Bearer AUTH_SECRET +
  // X-User-Role: admin) when the incoming caller has an authenticated
  // session. Attaching it unconditionally was a confused-deputy: the API
  // side treats the pair as admin identity, so an unauth caller reaching
  // the admin proxy would silently get admin-scoped access to every
  // /api/v1/* route that trusts proxy-level auth (A1 in the upstream
  // audit).
  //
  // For unauth callers, forward the request as-is — pass through the
  // incoming Authorization header so API-key callers still work, and let
  // the API's own edge proxy gate on its public-path / API-key rules.
  const headers: Record<string, string> = {};
  if (session?.user?.id) {
    headers["Authorization"] = `Bearer ${process.env.AUTH_SECRET}`;
    headers["X-User-Id"] = session.user.id;
    headers["X-User-Role"] = (session.user as { role?: string }).role ?? "author";
  } else {
    const incomingAuth = req.headers.get("authorization");
    if (incomingAuth) headers["Authorization"] = incomingAuth;
  }

  const contentType = req.headers.get("content-type");
  const isFormData = contentType?.includes("multipart/form-data");

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = isFormData ? await req.formData() : await req.text();
    if (!isFormData) headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, { method: req.method, headers, body, cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "API server unreachable" }, { status: 502 });
  }
  const resContentType = res.headers.get("content-type") ?? "";

  if (resContentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": resContentType } });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
