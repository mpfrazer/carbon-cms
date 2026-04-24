import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}` &&
    req.headers.get("x-user-role") === "admin"
  );
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    if (!webhook) return notFound("Webhook not found");

    const payload = JSON.stringify({
      event: "ping",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test delivery from Carbon CMS." },
    });
    const signature = createHmac("sha256", webhook.secret).update(payload).digest("hex");

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
      // Network error or timeout
    }

    await db.insert(webhookDeliveries).values({
      webhookId: id,
      event: "ping",
      payload,
      status,
      responseStatus,
      attempts: 1,
      lastAttemptAt: new Date(),
    });

    return ok({ status, responseStatus });
  } catch (e) {
    return serverError(e);
  }
}
