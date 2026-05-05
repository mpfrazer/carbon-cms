import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";

export const ALL_API_KEY_SCOPES = [
  "content:read", "content:write",
  "media:read", "media:write",
  "comments:read", "comments:moderate",
  "settings:read", "settings:write",
  "themes:read", "themes:write",
  "users:read", "users:write",
  "webhooks:read", "webhooks:write",
  "stats:read",
] as const;

export type ApiKeyScope = (typeof ALL_API_KEY_SCOPES)[number];

export function generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
  const key = `csk_${randomBytes(32).toString("base64url")}`;
  const keyPrefix = key.slice(0, 12); // "csk_" + 8 chars
  const keyHash = createHash("sha256").update(key).digest("hex");
  return { key, keyPrefix, keyHash };
}

/**
 * Returns the API key token (the part after "Bearer ") if the header is a
 * well-formed API key bearer, otherwise null. Pure prefix check — does not
 * verify the token against the database.
 */
export function extractApiKeyToken(authorizationHeader: string | null | undefined): string | null {
  if (!authorizationHeader) return null;
  if (!authorizationHeader.startsWith("Bearer csk_")) return null;
  return authorizationHeader.slice(7);
}

export async function validateApiKey(
  key: string,
): Promise<{ id: string; name: string; scopes: string[] } | null> {
  if (!key.startsWith("csk_")) return null;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const [found] = await db
    .select({ id: apiKeys.id, name: apiKeys.name, scopes: apiKeys.scopes })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);
  if (!found) return null;
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, found.id)).catch(() => {});
  return found;
}

/**
 * Returns true iff the validated key holds the required scope. Future PRs
 * that protect endpoints with API-key auth call this in their handler.
 */
export function hasScope(keyScopes: string[], required: ApiKeyScope): boolean {
  return keyScopes.includes(required);
}
