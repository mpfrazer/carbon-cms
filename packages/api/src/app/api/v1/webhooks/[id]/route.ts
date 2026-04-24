import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ok, badRequest, notFound, noContent, serverError } from "@/lib/api/response";
import { ALL_WEBHOOK_EVENTS } from "@/lib/webhook";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}` &&
    req.headers.get("x-user-role") === "admin"
  );
}

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  events: z.array(z.enum(ALL_WEBHOOK_EVENTS as [string, ...string[]])).min(1).optional(),
  active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const [row] = await db
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
      .where(eq(webhooks.id, id))
      .limit(1);

    if (!row) return notFound("Webhook not found");
    return ok(row);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select({ id: webhooks.id }).from(webhooks).where(eq(webhooks.id, id)).limit(1);
    if (!existing) return notFound("Webhook not found");

    const [updated] = await db
      .update(webhooks)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(webhooks.id, id))
      .returning({
        id: webhooks.id,
        name: webhooks.name,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        updatedAt: webhooks.updatedAt,
      });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const [existing] = await db.select({ id: webhooks.id }).from(webhooks).where(eq(webhooks.id, id)).limit(1);
    if (!existing) return notFound("Webhook not found");
    await db.delete(webhooks).where(eq(webhooks.id, id));
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
