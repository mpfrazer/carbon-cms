import { NextRequest, NextResponse } from "next/server";
import { desc, eq, count, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments, posts, settings } from "@/lib/db/schema";
import { ok, created, badRequest, serverError, paginated, parsePagination } from "@/lib/api/response";
import { stripHtml } from "@/lib/utils";
import { sendCommentNotificationEmail } from "@/lib/email";

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? null;
}

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  authorName: z.string().min(1).max(200),
  authorEmail: z.string().email(),
  authorUrl: z.string().url().optional(),
  content: z.string().min(1).max(10000),
  parentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);
    const postId = searchParams.get("postId");

    const isAdmin = req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}`;
    const role = req.headers.get("x-user-role");
    const canModerate = isAdmin && (role === "admin" || role === "editor");

    const conditions = [];
    if (canModerate) {
      const status = searchParams.get("status");
      if (status) conditions.push(eq(comments.status, status as "pending" | "approved" | "spam" | "trash"));
    } else {
      conditions.push(eq(comments.status, "approved"));
    }
    if (postId) conditions.push(eq(comments.postId, postId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({
          id: comments.id,
          postId: comments.postId,
          userId: comments.userId,
          authorName: comments.authorName,
          authorEmail: comments.authorEmail,
          authorUrl: comments.authorUrl,
          content: comments.content,
          status: comments.status,
          parentId: comments.parentId,
          editedAt: comments.editedAt,
          ipAddress: comments.ipAddress,
          userAgent: comments.userAgent,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          postTitle: posts.title,
          postSlug: posts.slug,
        })
        .from(comments)
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(where)
        .orderBy(desc(comments.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(comments).where(where),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [allowComments, requireLogin, commentModeration] = await Promise.all([
      getSetting("allowComments"),
      getSetting("requireLoginToComment"),
      getSetting("commentModeration"),
    ]);

    if (allowComments === "false") {
      return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
    }

    const userId = req.headers.get("x-user-id");
    if (requireLogin === "true" && !userId) {
      return NextResponse.json({ error: "You must be logged in to comment" }, { status: 401 });
    }

    const [post] = await db.select({ id: posts.id, title: posts.title, slug: posts.slug }).from(posts).where(eq(posts.id, parsed.data.postId)).limit(1);
    if (!post) return badRequest("Post not found");

    const content = stripHtml(parsed.data.content);
    if (!content) return badRequest("Comment content cannot be empty after sanitization");

    const status = commentModeration === "false" ? "approved" : "pending";
    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const [comment] = await db
      .insert(comments)
      .values({
        ...parsed.data,
        content,
        userId: userId ?? undefined,
        status,
        ipAddress,
        userAgent,
      })
      .returning();

    if (status === "pending") {
      sendCommentNotificationEmail({
        authorName: comment.authorName,
        postTitle: post.title,
        postSlug: post.slug,
        excerpt: comment.content.slice(0, 200) + (comment.content.length > 200 ? "…" : ""),
      }).catch((err) => console.error("[email] comment notification failed:", err));
    }

    return created(comment);
  } catch (e) {
    return serverError(e);
  }
}
