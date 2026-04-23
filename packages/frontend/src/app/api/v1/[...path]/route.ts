import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_URL = process.env.CARBON_API_URL ?? "http://localhost:3001";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const { path } = await params;
  const url = `${API_URL}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.AUTH_SECRET}`,
  };
  if (session?.user?.id) {
    headers["X-User-Id"] = session.user.id;
    headers["X-User-Role"] = (session.user as { role?: string }).role ?? "subscriber";
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
