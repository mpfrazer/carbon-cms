import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { isBuiltIn, readThemeConfig, writeThemeConfig } from "@/lib/theme-compiler";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ slug: string }> };

const capabilitiesSchema = z.object({
  blog: z.boolean(),
  search: z.object({ header: z.boolean(), page: z.boolean() }),
  pageBuilder: z.boolean(),
  comments: z.boolean(),
});

const variableSchema = z.object({
  key: z.string().min(1).max(64).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, "Must start with a letter; only letters, numbers, hyphens, and underscores allowed"),
  label: z.string().min(1).max(128),
  type: z.enum(["color", "string", "number", "select"]),
  default: z.union([z.string(), z.number()]),
  options: z.array(z.string()).optional(),
});

const configSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  capabilities: capabilitiesSchema.optional(),
  overrides: z.object({
    searchMode: z.enum(["none", "header", "page"]).optional(),
    searchInputMode: z.enum(["submit", "instant"]).optional(),
    showBlogLink: z.boolean().optional(),
    postsPerPage: z.number().int().min(1).max(100).optional(),
  }).optional(),
  variables: z.array(variableSchema).optional(),
});

async function resolveSlug(slug: string): Promise<string> {
  if (slug !== "active") return slug;
  const row = await db.select().from(settings).where(eq(settings.key, "activeTheme")).limit(1);
  return row[0] ? JSON.parse(row[0].value) : "default";
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const slug = await resolveSlug((await params).slug);
    const config = await readThemeConfig(slug);
    return ok({ slug, builtin: isBuiltIn(slug), ...config });
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const slug = await resolveSlug((await params).slug);
    if (isBuiltIn(slug)) return badRequest("Built-in theme configs are read-only. Create a custom theme to override.");

    const body = await req.json();
    const parsed = configSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const current = await readThemeConfig(slug);
    const updated = { ...current, ...parsed.data };
    await writeThemeConfig(slug, updated);

    return ok({ slug, ...updated });
  } catch (e) {
    return serverError(e);
  }
}
