import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hasAdminProxyAuth } from "../authz";

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret";
});

afterEach(() => {
  if (ORIGINAL_AUTH_SECRET === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = ORIGINAL_AUTH_SECRET;
});

function makeHeaders(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("hasAdminProxyAuth", () => {
  it("returns true when both AUTH_SECRET bearer and admin role are present", () => {
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer test-secret",
      "x-user-role": "admin",
    }))).toBe(true);
  });

  it("returns false when the bearer is missing", () => {
    expect(hasAdminProxyAuth(makeHeaders({
      "x-user-role": "admin",
    }))).toBe(false);
  });

  it("returns false when the bearer is wrong", () => {
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer wrong-secret",
      "x-user-role": "admin",
    }))).toBe(false);
  });

  it("returns false when the role header is missing", () => {
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer test-secret",
    }))).toBe(false);
  });

  it("returns false when the role is not admin", () => {
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer test-secret",
      "x-user-role": "editor",
    }))).toBe(false);
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer test-secret",
      "x-user-role": "author",
    }))).toBe(false);
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer test-secret",
      "x-user-role": "subscriber",
    }))).toBe(false);
  });

  it("returns false for an empty header set", () => {
    expect(hasAdminProxyAuth(makeHeaders({}))).toBe(false);
  });

  it("does not accept an API-key bearer in place of AUTH_SECRET", () => {
    expect(hasAdminProxyAuth(makeHeaders({
      authorization: "Bearer csk_some-valid-looking-key",
      "x-user-role": "admin",
    }))).toBe(false);
  });
});
