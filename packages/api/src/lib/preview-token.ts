import { createHmac, timingSafeEqual } from "crypto";

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function signPreviewToken(id: string, kind: "post" | "page"): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload = Buffer.from(
    JSON.stringify({ id, kind, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })
  ).toString("base64url");
  const sig = b64url(createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyPreviewToken(token: string): { id: string; kind: "post" | "page" } | null {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = b64url(createHmac("sha256", secret).update(payload).digest());
    if (!timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"))) return null;
    const { id, kind, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Math.floor(Date.now() / 1000) > exp) return null;
    if (kind !== "post" && kind !== "page") return null;
    return { id, kind };
  } catch {
    return null;
  }
}
