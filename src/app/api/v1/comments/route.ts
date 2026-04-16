import { NextRequest } from "next/server";
import { desc, eq, count, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { ok, created, badRequest, serverError, paginated, parsePagination } from "@/lib/api/response";

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  authorName: z.string().min(1).max(200),
  authorEmail: z.string().email(),
  authorUrl: z.string().url().optional(),
  content: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const postId = searchParams.get("postId");

    const conditions = [];
    if (status) conditions.push(eq(comments.status, status as "pending" | "approved" | "spam" | "trash"));
    if (postId) conditions.push(eq(comments.postId, postId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(comments).where(where).orderBy(desc(comments.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(comments).where(where),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const [comment] = await db
      .insert(comments)
      .values({ ...parsed.data, status: "pending", ipAddress, userAgent })
      .returning();

    return created(comment);
  } catch {
    return serverError();
  }
}
