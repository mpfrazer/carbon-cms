import { createHmac, randomBytes } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";

export type WebhookEvent =
  | "post.created" | "post.published" | "post.updated" | "post.deleted"
  | "page.created" | "page.published" | "page.updated" | "page.deleted"
  | "comment.created" | "comment.approved"
  | "media.uploaded" | "media.deleted";

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  "post.created", "post.published", "post.updated", "post.deleted",
  "page.created", "page.published", "page.updated", "page.deleted",
  "comment.created", "comment.approved",
  "media.uploaded", "media.deleted",
];

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("base64url");
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function dispatchWebhooks(event: WebhookEvent, data: unknown): void {
  void (async () => {
    try {
      const targets = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.active, true), sql`${event} = ANY(${webhooks.events})`));

      await Promise.allSettled(
        targets.map(async (webhook) => {
          const payload = JSON.stringify({ event, timestamp: new Date().toISOString(), data });
          const signature = sign(webhook.secret, payload);

          let responseStatus: number | null = null;
          let status: "delivered" | "failed" = "failed";

          try {
            const res = await fetch(webhook.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Carbon-Signature": `sha256=${signature}`,
                "User-Agent": "CarbonCMS-Webhook/1.0",
              },
              body: payload,
              signal: AbortSignal.timeout(10_000),
            });
            responseStatus = res.status;
            status = res.ok ? "delivered" : "failed";
          } catch {
            // Network error or timeout — status stays "failed"
          }

          await db.insert(webhookDeliveries).values({
            webhookId: webhook.id,
            event,
            payload,
            status,
            responseStatus,
            attempts: 1,
            lastAttemptAt: new Date(),
          });
        })
      );
    } catch (e) {
      console.error("[webhook] dispatch error:", e);
    }
  })();
}
