import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, postCategories, postTags, categories, tags, media } from "@/lib/db/schema";
import type { CarbonMcpTool } from "../registry";
import { textResult, errorResult } from "../registry";

export const getPostTool = {
  name: "get_post",
  title: "Get a post",
  description:
    "Fetch a single post by its ID (UUID) or slug, including its template, structured data, categories, tags, and featured image. Use this when you need the full content of a known post — e.g. to summarize it, reference it, or edit it.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Post UUID. Pass either id or slug."),
    slug: z.string().min(1).optional().describe("Post slug. Pass either id or slug."),
  },
  requiredScopes: ["content:read"] as const,
  handler: async (args) => {
    const id = typeof args.id === "string" ? args.id : undefined;
    const slug = typeof args.slug === "string" ? args.slug : undefined;
    if (!id && !slug) return errorResult("Pass either id or slug.");

    const where = id
      ? eq(posts.id, id)
      : slug
        ? eq(posts.slug, slug)
        : undefined;
    if (!where) return errorResult("Pass either id or slug.");

    const [post] = await db.select().from(posts).where(where).limit(1);
    if (!post) return errorResult(`Post not found: ${id ?? slug}`);

    const [postCats, postTagRows, featuredImageRows] = await Promise.all([
      db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(eq(postCategories.postId, post.id)),
      db
        .select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, post.id)),
      post.featuredImageId
        ? db
            .select({ id: media.id, url: media.url, altText: media.altText })
            .from(media)
            .where(eq(media.id, post.featuredImageId))
            .limit(1)
        : Promise.resolve([] as Array<{ id: string; url: string; altText: string | null }>),
    ]);

    return textResult(
      JSON.stringify(
        {
          ...post,
          categories: postCats,
          tags: postTagRows,
          featuredImage: featuredImageRows[0] ?? null,
        },
        null,
        2,
      ),
    );
  },
} satisfies CarbonMcpTool;

