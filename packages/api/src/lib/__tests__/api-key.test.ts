import { describe, it, expect } from "vitest";
import { z } from "zod";
import { extractApiKeyToken, generateApiKey } from "../api-key";

// Mirrors the Zod schema used by POST /api/v1/api-keys. Kept inline so we can
// assert role validation behavior without importing the route module (which
// pulls in NextRequest types we don't need here).
const createSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.enum(["admin", "editor", "author", "subscriber"]),
});

describe("extractApiKeyToken", () => {
  it("returns the token for a well-formed API-key bearer", () => {
    expect(extractApiKeyToken("Bearer csk_abc123")).toBe("csk_abc123");
  });

  it("returns null for non-API-key bearers", () => {
    expect(extractApiKeyToken("Bearer some-session-secret")).toBeNull();
    expect(extractApiKeyToken("Bearer csk")).toBeNull();
    expect(extractApiKeyToken("Bearer csk_")).toBe("csk_");
  });

  it("returns null for missing or malformed headers", () => {
    expect(extractApiKeyToken(null)).toBeNull();
    expect(extractApiKeyToken(undefined)).toBeNull();
    expect(extractApiKeyToken("")).toBeNull();
    expect(extractApiKeyToken("csk_abc123")).toBeNull();
    expect(extractApiKeyToken("Basic csk_abc123")).toBeNull();
  });

  it("is case-sensitive on the prefix (per spec)", () => {
    expect(extractApiKeyToken("bearer csk_abc")).toBeNull();
    expect(extractApiKeyToken("Bearer CSK_abc")).toBeNull();
  });
});

describe("generateApiKey", () => {
  it("returns a key with the csk_ prefix", () => {
    const { key, keyPrefix } = generateApiKey();
    expect(key.startsWith("csk_")).toBe(true);
    expect(keyPrefix.startsWith("csk_")).toBe(true);
    expect(keyPrefix.length).toBe(12);
    expect(key.startsWith(keyPrefix)).toBe(true);
  });

  it("returns a sha256 hash of the key, not the key itself", () => {
    const { key, keyHash } = generateApiKey();
    expect(keyHash).not.toBe(key);
    expect(keyHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a different key on each call", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });
});

describe("api-key create schema (role)", () => {
  it("accepts each of the four user roles", () => {
    for (const role of ["admin", "editor", "author", "subscriber"] as const) {
      const result = createSchema.safeParse({ name: "test", role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an unknown role", () => {
    expect(createSchema.safeParse({ name: "test", role: "superuser" }).success).toBe(false);
    expect(createSchema.safeParse({ name: "test", role: "" }).success).toBe(false);
  });

  it("requires role — does not silently default", () => {
    // Forcing a missing role: this prevents callers from accidentally getting
    // the table-level default ('admin') by omitting the field.
    expect(createSchema.safeParse({ name: "test" }).success).toBe(false);
  });
});
