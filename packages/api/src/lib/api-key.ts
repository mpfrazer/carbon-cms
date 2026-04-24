import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";

export function generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
  const key = `csk_${randomBytes(32).toString("base64url")}`;
  const keyPrefix = key.slice(0, 12); // "csk_" + 8 chars
  const keyHash = createHash("sha256").update(key).digest("hex");
  return { key, keyPrefix, keyHash };
}

export async function validateApiKey(key: string): Promise<{ id: string; name: string } | null> {
  if (!key.startsWith("csk_")) return null;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const [found] = await db
    .select({ id: apiKeys.id, name: apiKeys.name })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);
  if (!found) return null;
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, found.id)).catch(() => {});
  return found;
}
