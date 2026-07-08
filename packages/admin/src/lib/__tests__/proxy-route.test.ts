import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock @/lib/auth BEFORE importing the route so the route's `auth` symbol
// resolves to the mock. Hoisted so vi.mock's factory can reference it.
const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: authMock }));

// eslint-disable-next-line import/first
import { GET, POST } from "@/app/api/v1/[...path]/route";

describe("admin API proxy — A1 auth bypass regression", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;
  const ORIGINAL_API_URL = process.env.CARBON_API_URL;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
    process.env.CARBON_API_URL = "http://api.test";
    fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    authMock.mockReset();
  });

  afterEach(() => {
    if (ORIGINAL_AUTH_SECRET === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET;
    if (ORIGINAL_API_URL === undefined) delete process.env.CARBON_API_URL;
    else process.env.CARBON_API_URL = ORIGINAL_API_URL;
    vi.restoreAllMocks();
  });

  function forwardedHeaders(): Record<string, string> {
    return fetchMock.mock.calls[0][1].headers as Record<string, string>;
  }

  it("does NOT attach Bearer AUTH_SECRET when the caller has no session", async () => {
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://admin.test/api/v1/themes");
    await GET(req, { params: Promise.resolve({ path: ["themes"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBeUndefined();
    expect(h["X-User-Id"]).toBeUndefined();
    expect(h["X-User-Role"]).toBeUndefined();
  });

  it("attaches Bearer + X-User-Id + X-User-Role: admin when the caller has an admin session", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", role: "admin" } });
    const req = new NextRequest("http://admin.test/api/v1/themes");
    await GET(req, { params: Promise.resolve({ path: ["themes"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBe("Bearer test-secret");
    expect(h["X-User-Id"]).toBe("user-1");
    expect(h["X-User-Role"]).toBe("admin");
  });

  it("forwards the incoming Authorization header (API-key callers) when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://admin.test/api/v1/themes", {
      headers: { authorization: "Bearer csk_dummy-key" },
    });
    await GET(req, { params: Promise.resolve({ path: ["themes"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBe("Bearer csk_dummy-key");
  });

  it("does not synthesize any headers when no session and no incoming Authorization", async () => {
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://admin.test/api/v1/setup");
    await GET(req, { params: Promise.resolve({ path: ["setup"] }) });

    const h = forwardedHeaders();
    // /setup is public on the API side; the proxy should not inject any auth
    // on the caller's behalf — the API's PUBLIC_ANY_PATHS gate lets it through.
    expect(h["Authorization"]).toBeUndefined();
  });

  it("still attaches admin credentials for state-changing verbs when authed", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "admin" } });
    const req = new NextRequest("http://admin.test/api/v1/themes/foo/compile", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    await POST(req, { params: Promise.resolve({ path: ["themes", "foo", "compile"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBe("Bearer test-secret");
    expect(h["X-User-Role"]).toBe("admin");
  });

  it("rejects POST /compile with no session — no admin credentials forwarded", async () => {
    // The previous behavior forwarded a service Bearer for any caller, which
    // meant unauth POST /compile ran esbuild (CPU DoS vector). Now with no
    // session and no incoming Authorization, the proxy forwards nothing —
    // the API's edge proxy will 401 the request.
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://admin.test/api/v1/themes/foo/compile", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    await POST(req, { params: Promise.resolve({ path: ["themes", "foo", "compile"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBeUndefined();
    expect(h["X-User-Role"]).toBeUndefined();
  });
});
