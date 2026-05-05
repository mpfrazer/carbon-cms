import { createHmac, randomBytes } from "crypto";
import { and, eq, isNotNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";

export const ALL_WEBHOOK_EVENTS = [
  "post.created", "post.published", "post.updated", "post.deleted",
  "post.submitted_review", "post.approved", "post.rejected",
  "page.created", "page.published", "page.updated", "page.deleted",
  "comment.created", "comment.approved",
  "media.uploaded", "media.deleted",
] as const;

export type WebhookEvent = (typeof ALL_WEBHOOK_EVENTS)[number];

export const MAX_DELIVERY_ATTEMPTS = 4;
const BACKOFF_SECONDS = [30, 300, 1800] as const; // delay AFTER attempts 1, 2, 3

/**
 * Returns the seconds to wait before the next retry, given how many attempts
 * have already completed. Returns null when no further retries should occur
 * (delivered, or attempt budget exhausted).
 */
export function nextRetryDelaySeconds(attemptsCompleted: number): number | null {
  if (attemptsCompleted < 1 || attemptsCompleted >= MAX_DELIVERY_ATTEMPTS) return null;
  return BACKOFF_SECONDS[attemptsCompleted - 1];
}

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("base64url");
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverOnce(
  url: string,
  secret: string,
  payload: string,
): Promise<{ ok: boolean; status: number | null }> {
  const signature = sign(secret, payload);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Carbon-Signature": `sha256=${signature}`,
        "User-Agent": "CarbonCMS-Webhook/1.0",
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  }
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
          const attemptedAt = new Date();
          const result = await deliverOnce(webhook.url, webhook.secret, payload);
          const status: "delivered" | "failed" = result.ok ? "delivered" : "failed";
          const nextDelay = result.ok ? null : nextRetryDelaySeconds(1);
          const nextRetryAt = nextDelay
            ? new Date(attemptedAt.getTime() + nextDelay * 1000)
            : null;

          await db.insert(webhookDeliveries).values({
            webhookId: webhook.id,
            event,
            payload,
            status,
            responseStatus: result.status,
            attempts: 1,
            lastAttemptAt: attemptedAt,
            nextRetryAt,
          });
        }),
      );
    } catch (e) {
      console.error("[webhook] dispatch error:", e);
    }
  })();
}

/**
 * Processes one batch of deliveries due for retry. Intended to be called by
 * the cron route on a 1-minute cadence. Returns counts for observability.
 *
 * Each due delivery gets one fresh attempt. On success the row transitions to
 * `delivered`. On failure attempts is incremented and nextRetryAt is set
 * according to the backoff schedule, or cleared when the attempt budget is
 * exhausted (status stays `failed`). Inactive webhooks have their pending
 * retries cleared so they stop being selected.
 */
export async function retryDueWebhooks(): Promise<{
  attempted: number;
  succeeded: number;
  exhausted: number;
}> {
  const now = new Date();

  const due = await db
    .select({
      deliveryId: webhookDeliveries.id,
      payload: webhookDeliveries.payload,
      attempts: webhookDeliveries.attempts,
      webhookActive: webhooks.active,
      webhookUrl: webhooks.url,
      webhookSecret: webhooks.secret,
    })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
    .where(
      and(
        eq(webhookDeliveries.status, "failed"),
        isNotNull(webhookDeliveries.nextRetryAt),
        lte(webhookDeliveries.nextRetryAt, now),
        lt(webhookDeliveries.attempts, MAX_DELIVERY_ATTEMPTS),
      ),
    );

  if (due.length === 0) return { attempted: 0, succeeded: 0, exhausted: 0 };

  let succeeded = 0;
  let exhausted = 0;

  await Promise.allSettled(
    due.map(async (row) => {
      if (!row.webhookActive) {
        await db
          .update(webhookDeliveries)
          .set({ nextRetryAt: null })
          .where(eq(webhookDeliveries.id, row.deliveryId));
        return;
      }

      const attemptedAt = new Date();
      const result = await deliverOnce(row.webhookUrl, row.webhookSecret, row.payload);
      const newAttempts = row.attempts + 1;

      if (result.ok) {
        succeeded++;
        await db
          .update(webhookDeliveries)
          .set({
            status: "delivered",
            responseStatus: result.status,
            attempts: newAttempts,
            lastAttemptAt: attemptedAt,
            nextRetryAt: null,
          })
          .where(eq(webhookDeliveries.id, row.deliveryId));
      } else {
        const nextDelay = nextRetryDelaySeconds(newAttempts);
        const nextRetryAt = nextDelay
          ? new Date(attemptedAt.getTime() + nextDelay * 1000)
          : null;
        if (nextRetryAt === null) exhausted++;

        await db
          .update(webhookDeliveries)
          .set({
            responseStatus: result.status,
            attempts: newAttempts,
            lastAttemptAt: attemptedAt,
            nextRetryAt,
          })
          .where(eq(webhookDeliveries.id, row.deliveryId));
      }
    }),
  );

  return { attempted: due.length, succeeded, exhausted };
}
