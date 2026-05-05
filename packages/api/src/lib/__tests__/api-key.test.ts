import { describe, it, expect } from "vitest";
import { extractApiKeyToken, generateApiKey } from "../api-key";

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
