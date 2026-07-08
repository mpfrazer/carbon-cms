import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: authMock }));

// eslint-disable-next-line import/first
import { GET, POST } from "@/app/api/v1/[...path]/route";

describe("frontend API proxy — A1 auth bypass regression", () => {
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
    const req = new NextRequest("http://frontend.test/api/v1/users");
    await GET(req, { params: Promise.resolve({ path: ["users"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBeUndefined();
    expect(h["X-User-Id"]).toBeUndefined();
    expect(h["X-User-Role"]).toBeUndefined();
  });

  it("attaches Bearer + session identity when the caller is logged in", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", role: "subscriber" } });
    const req = new NextRequest("http://frontend.test/api/v1/comments", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    await POST(req, { params: Promise.resolve({ path: ["comments"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBe("Bearer test-secret");
    expect(h["X-User-Id"]).toBe("user-1");
    expect(h["X-User-Role"]).toBe("subscriber");
  });

  it("forwards the incoming Authorization header (API-key callers) when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://frontend.test/api/v1/posts", {
      headers: { authorization: "Bearer csk_dummy-key" },
    });
    await GET(req, { params: Promise.resolve({ path: ["posts"] }) });

    const h = forwardedHeaders();
    expect(h["Authorization"]).toBe("Bearer csk_dummy-key");
  });

  it("public reads (e.g. /posts) forward without any injected auth for unauth callers", async () => {
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://frontend.test/api/v1/posts");
    await GET(req, { params: Promise.resolve({ path: ["posts"] }) });

    const h = forwardedHeaders();
    // Public GET → no auth needed. API side's PUBLIC_GET_PREFIXES lets it through.
    expect(h["Authorization"]).toBeUndefined();
  });
});
