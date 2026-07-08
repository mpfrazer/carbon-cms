import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

// Prior behavior: the API edge proxy short-circuited any request bearing
// `Authorization: Bearer ${AUTH_SECRET}` — skipping rate limiting AND auth.
// Combined with the admin/frontend proxies attaching that bearer to every
// forwarded request (including unauthenticated ones), the result was an
// admin-privileged bypass on every /api/v1/* route that trusted the proxy
// (A1 in the upstream audit).
//
// Post-fix: the short-circuit now also requires `X-User-Role: admin` — the
// pair that packages/admin's proxy only produces when the caller has an
// authenticated session. Bearer alone is not enough.

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;

describe("API edge proxy — Bearer short-circuit requires X-User-Role: admin", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    if (ORIGINAL_AUTH_SECRET === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET;
  });

  it("short-circuits when Bearer AND X-User-Role: admin are both present (authed admin call)", async () => {
    const req = new NextRequest("http://api.test/api/v1/themes", {
      headers: {
        authorization: "Bearer test-secret",
        "x-user-role": "admin",
      },
    });
    const res = await proxy(req);
    // NextResponse.next() surfaces as 200; the key assertion is "not 401".
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(429);
  });

  it("does NOT short-circuit when Bearer is present but X-User-Role is missing (the confused-deputy)", async () => {
    const req = new NextRequest("http://api.test/api/v1/themes", {
      headers: { authorization: "Bearer test-secret" },
    });
    const res = await proxy(req);
    // No API key, protected route, no admin role → 401.
    expect(res.status).toBe(401);
  });

  it("does NOT short-circuit when Bearer is present with a non-admin X-User-Role", async () => {
    const req = new NextRequest("http://api.test/api/v1/themes", {
      headers: {
        authorization: "Bearer test-secret",
        "x-user-role": "editor",
      },
    });
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for a protected route with no auth at all", async () => {
    const req = new NextRequest("http://api.test/api/v1/themes");
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it("passes an unauthenticated PUBLIC_GET_PREFIXES route through (not short-circuit; public gate)", async () => {
    const req = new NextRequest("http://api.test/api/v1/posts");
    const res = await proxy(req);
    // Not 401 — /posts is in PUBLIC_GET_PREFIXES, so public GET is allowed
    // without any auth. The response is NextResponse.next() (status 200).
    expect(res.status).not.toBe(401);
  });

  it("passes an unauthenticated PUBLIC_ANY_PATHS route through (e.g. /setup)", async () => {
    const req = new NextRequest("http://api.test/api/v1/setup", { method: "POST" });
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
  });
});
