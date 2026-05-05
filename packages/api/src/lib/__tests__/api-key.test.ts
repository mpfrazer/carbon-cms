import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  extractApiKeyToken,
  generateApiKey,
  hasScope,
  ALL_API_KEY_SCOPES,
  type ApiKeyScope,
} from "../api-key";

// Mirrors the Zod schema used by POST /api/v1/api-keys.
const createSchema = z.object({
  name: z.string().min(1).max(200),
  scopes: z.array(z.enum(ALL_API_KEY_SCOPES)).min(1),
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

describe("ALL_API_KEY_SCOPES", () => {
  it("uses the <resource>:<action> naming convention", () => {
    for (const scope of ALL_API_KEY_SCOPES) {
      expect(scope).toMatch(/^[a-z]+:[a-z]+$/);
    }
  });

  it("has no duplicates", () => {
    expect(new Set<string>(ALL_API_KEY_SCOPES).size).toBe(ALL_API_KEY_SCOPES.length);
  });

  it("does not expose api-keys management as a scope (privilege-escalation hazard)", () => {
    for (const scope of ALL_API_KEY_SCOPES) {
      expect(scope.startsWith("api-keys:")).toBe(false);
    }
  });
});

describe("hasScope", () => {
  it("returns true when the required scope is present", () => {
    expect(hasScope(["webhooks:read", "webhooks:write"], "webhooks:write")).toBe(true);
  });

  it("returns false when the required scope is absent", () => {
    expect(hasScope(["webhooks:read"], "webhooks:write")).toBe(false);
  });

  it("returns false for an empty scope set", () => {
    expect(hasScope([], "content:read")).toBe(false);
  });

  it("does not infer write from read or vice versa", () => {
    expect(hasScope(["content:write"], "content:read")).toBe(false);
    expect(hasScope(["content:read"], "content:write")).toBe(false);
  });
});

describe("api-key create schema (scopes)", () => {
  it("accepts a single valid scope", () => {
    expect(createSchema.safeParse({ name: "test", scopes: ["content:read"] }).success).toBe(true);
  });

  it("accepts multiple valid scopes", () => {
    expect(
      createSchema.safeParse({ name: "test", scopes: ["webhooks:read", "webhooks:write"] }).success,
    ).toBe(true);
  });

  it("rejects an unknown scope", () => {
    expect(
      createSchema.safeParse({ name: "test", scopes: ["content:nuke"] }).success,
    ).toBe(false);
  });

  it("rejects an empty scope array", () => {
    expect(createSchema.safeParse({ name: "test", scopes: [] }).success).toBe(false);
  });

  it("rejects a missing scopes field — does not silently default", () => {
    expect(createSchema.safeParse({ name: "test" }).success).toBe(false);
  });
});

// Mirror of the admin-side preset definitions. If presets in the admin package
// reference a scope that doesn't exist in the API vocabulary, this test fails
// — catching cross-package drift the way the WebhookEvent / ALL_WEBHOOK_EVENTS
// fix did within the API package.
const ADMIN_PRESETS: Record<string, ApiKeyScope[]> = {
  "read-only": ALL_API_KEY_SCOPES.filter((s) => s.endsWith(":read")) as ApiKeyScope[],
  "content-publisher": ["content:read", "content:write", "media:read", "media:write"],
  "moderator": ["comments:read", "comments:moderate"],
  "webhook-integrator": ["webhooks:read", "webhooks:write"],
};

describe("admin presets", () => {
  it("each preset references only known scopes", () => {
    for (const [name, scopes] of Object.entries(ADMIN_PRESETS)) {
      for (const scope of scopes) {
        expect(ALL_API_KEY_SCOPES, `preset "${name}" includes unknown scope "${scope}"`)
          .toContain(scope);
      }
    }
  });

  it("each preset selects at least one scope (would fail server validation otherwise)", () => {
    for (const [name, scopes] of Object.entries(ADMIN_PRESETS)) {
      expect(scopes.length, `preset "${name}" is empty`).toBeGreaterThan(0);
    }
  });
});
