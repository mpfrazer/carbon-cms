import { NextRequest } from "next/server";
import { extractApiKeyToken, validateApiKey, hasScope, type ApiKeyScope } from "./api-key";

export type AuthzResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * True iff the request carries the admin-proxy auth pair: the AUTH_SECRET
 * bearer plus the admin role header. Pure header inspection — does not touch
 * the database.
 */
export function hasAdminProxyAuth(headers: Headers): boolean {
  return (
    headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}` &&
    headers.get("x-user-role") === "admin"
  );
}

/**
 * Authorizes a request against a required API-key scope. Admin proxy auth
 * passes unconditionally (admins have full authority). Otherwise the request
 * must carry a valid API key whose scopes include the required one.
 */
export async function authorize(req: NextRequest, requiredScope: ApiKeyScope): Promise<AuthzResult> {
  if (hasAdminProxyAuth(req.headers)) return { ok: true };

  const token = extractApiKeyToken(req.headers.get("authorization"));
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  const validated = await validateApiKey(token);
  if (!validated) return { ok: false, status: 401, error: "Invalid API key" };

  if (!hasScope(validated.scopes, requiredScope)) {
    return { ok: false, status: 403, error: `Missing required scope: ${requiredScope}` };
  }

  return { ok: true };
}
