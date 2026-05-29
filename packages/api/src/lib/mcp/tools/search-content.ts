import { z } from "zod";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import type { CarbonMcpTool } from "../registry";
import { textResult } from "../registry";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const searchContentTool = {
  name: "search_content",
  title: "Search posts",
  description:
    "Search across published posts by title and body content. Use this to discover what exists on the site — finding posts to reference, summarize, edit, or build on. Returns a list of matches with title, slug, excerpt, template, and publish date; call get_post for the full body of any match.",
  inputSchema: {
    query: z.string().min(1).describe("Search text. Matched against post title and body content."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(MAX_LIMIT)
      .optional()
      .describe(`Maximum results to return. Default ${DEFAULT_LIMIT}, maximum ${MAX_LIMIT}.`),
    template: z
      .string()
      .optional()
      .describe(
        "Restrict to a single template kind (e.g. 'recipe', 'book-review'). Omit to search all templates.",
      ),
  },
  requiredScopes: ["content:read"] as const,
  handler: async (args) => {
    const query = String(args.query ?? "");
    const limit = typeof args.limit === "number" ? args.limit : undefined;
    const template = typeof args.template === "string" ? args.template : undefined;
    const cap = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const pattern = `%${query}%`;

    const conditions = [
      eq(posts.status, "published"),
      or(like(posts.title, pattern), like(posts.content, pattern))!,
    ];
    if (template) conditions.push(eq(posts.template, template));

    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        template: posts.template,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
      .limit(cap);

    return textResult(
      JSON.stringify(
        {
          query,
          count: rows.length,
          results: rows,
        },
        null,
        2,
      ),
    );
  },
} satisfies CarbonMcpTool;
