import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";
import { authorize } from "@/lib/authz";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await authorize(req, "webhooks:read");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    const [webhook] = await db.select({ id: webhooks.id }).from(webhooks).where(eq(webhooks.id, id)).limit(1);
    if (!webhook) return notFound("Webhook not found");

    const rows = await db
      .select({
        id: webhookDeliveries.id,
        event: webhookDeliveries.event,
        status: webhookDeliveries.status,
        responseStatus: webhookDeliveries.responseStatus,
        attempts: webhookDeliveries.attempts,
        lastAttemptAt: webhookDeliveries.lastAttemptAt,
        createdAt: webhookDeliveries.createdAt,
      })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, id))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(50);

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}
