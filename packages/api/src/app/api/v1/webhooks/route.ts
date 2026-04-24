import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { generateWebhookSecret, ALL_WEBHOOK_EVENTS } from "@/lib/webhook";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}` &&
    req.headers.get("x-user-role") === "admin"
  );
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  events: z.array(z.enum(ALL_WEBHOOK_EVENTS as [string, ...string[]])).min(1),
});

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: webhooks.id,
        name: webhooks.name,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        createdAt: webhooks.createdAt,
        updatedAt: webhooks.updatedAt,
      })
      .from(webhooks)
      .orderBy(desc(webhooks.createdAt));

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const secret = generateWebhookSecret();

    const [row] = await db
      .insert(webhooks)
      .values({ ...parsed.data, secret })
      .returning({
        id: webhooks.id,
        name: webhooks.name,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        createdAt: webhooks.createdAt,
      });

    // Secret returned only on creation
    return created({ ...row, secret });
  } catch (e) {
    return serverError(e);
  }
}
