import { NextRequest } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { ok, serverError } from "@/lib/api/response";
import { NextResponse } from "next/server";

function isAuthorized(req: NextRequest): boolean {
  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${process.env.AUTH_SECRET}`) return true;
  // Vercel Cron sends this header automatically
  const vercelAuth = req.headers.get("x-vercel-cron-authorization");
  if (vercelAuth === `Bearer ${process.env.CRON_SECRET ?? process.env.AUTH_SECRET}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const due = await db
      .select({ id: posts.id, scheduledAt: posts.scheduledAt })
      .from(posts)
      .where(and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, now)));

    if (due.length === 0) {
      return ok({ published: 0, ids: [] });
    }

    await Promise.all(
      due.map((post) =>
        db
          .update(posts)
          .set({
            status: "published",
            publishedAt: post.scheduledAt,
            updatedAt: now,
          })
          .where(eq(posts.id, post.id))
      )
    );

    console.log(`[cron] published ${due.length} scheduled post(s):`, due.map((p) => p.id));
    return ok({ published: due.length, ids: due.map((p) => p.id) });
  } catch (e) {
    return serverError(e);
  }
}
