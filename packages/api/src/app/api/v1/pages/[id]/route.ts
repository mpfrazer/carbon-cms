import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { ok, badRequest, notFound, conflict, noContent, serverError } from "@/lib/api/response";
import { slugify } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhook";
import { saveRevision } from "@/lib/revisions";
import { serializeBlocksToContent } from "@/lib/blocks";

const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  blocks: z.string().nullable().optional(), // JSON string or null
  status: z.enum(["draft", "published"]).optional(),
  parentId: z.string().uuid().optional().nullable(),
  featuredImageId: z.string().uuid().optional().nullable(),
  menuOrder: z.number().int().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
    if (!page) return notFound("Page not found");
    return ok(page);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
    if (!existing) return notFound("Page not found");

    const { title, slug: rawSlug, blocks: rawBlocks, content: rawContent, ...rest } = parsed.data;
    let slug = rawSlug;
    if (title && !slug) slug = slugify(title);

    if (slug && slug !== existing.slug) {
      const [slugConflict] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).limit(1);
      if (slugConflict) return conflict(`Slug "${slug}" is already in use`);
    }

    // When blocks are provided, derive a plain-text content fallback for search/RSS
    let content = rawContent;
    if (rawBlocks !== undefined && rawBlocks !== null) {
      try {
        const parsed2 = JSON.parse(rawBlocks);
        if (Array.isArray(parsed2)) content = serializeBlocksToContent(parsed2);
      } catch { /* keep rawContent if blocks are invalid */ }
    }

    const [updated] = await db
      .update(pages)
      .set({
        ...(title ? { title } : {}),
        ...(slug ? { slug } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(rawBlocks !== undefined ? { blocks: rawBlocks } : {}),
        ...rest,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning();

    void saveRevision("page", id, {
      title: updated.title, slug: updated.slug, content: updated.content, blocks: updated.blocks,
      status: updated.status, parentId: updated.parentId, featuredImageId: updated.featuredImageId,
      menuOrder: updated.menuOrder, metaTitle: updated.metaTitle, metaDescription: updated.metaDescription,
    }, req.headers.get("x-user-id"));
    dispatchWebhooks("page.updated", updated);
    if (updated.status === "published" && existing.status !== "published") {
      dispatchWebhooks("page.published", updated);
    }
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: pages.id }).from(pages).where(eq(pages.id, id)).limit(1);
    if (!existing) return notFound("Page not found");
    await db.delete(pages).where(eq(pages.id, id));
    dispatchWebhooks("page.deleted", { id });
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
