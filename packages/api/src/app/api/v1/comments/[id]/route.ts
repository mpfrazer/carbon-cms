import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments, settings } from "@/lib/db/schema";
import { ok, badRequest, notFound, noContent, serverError } from "@/lib/api/response";
import { stripHtml } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhook";

type Params = { params: Promise<{ id: string }> };

const adminUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "spam", "trash"]),
});

const ownerUpdateSchema = z.object({
  content: z.string().min(1).max(10000),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!comment) return notFound("Comment not found");
    return ok(comment);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const isAdmin = req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}`;
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id");

    const [existing] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!existing) return notFound("Comment not found");

    const body = await req.json();

    if (role === "admin" || role === "editor") {
      const parsed = adminUpdateSchema.safeParse(body);
      if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
      const [updated] = await db
        .update(comments)
        .set({ status: parsed.data.status, updatedAt: new Date() })
        .where(eq(comments.id, id))
        .returning();
      if (updated.status === "approved" && existing.status !== "approved") {
        dispatchWebhooks("comment.approved", updated);
      }
      return ok(updated);
    }

    if (userId && existing.userId === userId) {
      const parsed = ownerUpdateSchema.safeParse(body);
      if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
      const content = stripHtml(parsed.data.content);
      if (!content) return badRequest("Comment content cannot be empty after sanitization");

      const [modSetting] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, "commentModeration"))
        .limit(1);
      const moderationOn = modSetting?.value !== "false";
      const newStatus = moderationOn && existing.status === "approved" ? "pending" : existing.status;

      const [updated] = await db
        .update(comments)
        .set({ content, editedAt: new Date(), status: newStatus, updatedAt: new Date() })
        .where(eq(comments.id, id))
        .returning();
      return ok(updated);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const isAdmin = req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}`;
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = req.headers.get("x-user-role");
    if (role !== "admin" && role !== "editor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [existing] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1);
    if (!existing) return notFound("Comment not found");
    await db.delete(comments).where(eq(comments.id, id));
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
