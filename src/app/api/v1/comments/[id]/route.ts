import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { ok, badRequest, notFound, noContent, serverError } from "@/lib/api/response";

const updateCommentSchema = z.object({
  status: z.enum(["pending", "approved", "spam", "trash"]).optional(),
  content: z.string().min(1).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!comment) return notFound("Comment not found");
    return ok(comment);
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1);
    if (!existing) return notFound("Comment not found");

    const [updated] = await db
      .update(comments)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1);
    if (!existing) return notFound("Comment not found");
    await db.delete(comments).where(eq(comments.id, id));
    return noContent();
  } catch {
    return serverError();
  }
}
