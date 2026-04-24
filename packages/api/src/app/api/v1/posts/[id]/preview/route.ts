import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";
import { signPreviewToken } from "@/lib/preview-token";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  const bearer = req.headers.get("authorization");
  if (!userId || bearer !== `Bearer ${process.env.AUTH_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return notFound("Post not found");

    const token = signPreviewToken(post.id, "post");
    const frontendUrl = process.env.CARBON_FRONTEND_URL ?? "http://localhost:3003";
    return ok({ token, previewUrl: `${frontendUrl}/preview?token=${encodeURIComponent(token)}` });
  } catch (e) {
    return serverError(e);
  }
}
