import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ok, badRequest, created, conflict, serverError } from "@/lib/api/response";
import {
  BUILT_IN_THEMES,
  CUSTOM_THEMES_DIR,
  THEME_CACHE_DIR,
  THEME_FILES,
  isBuiltIn,
  readThemeConfig,
  copyTheme,
  compileTheme,
  listCustomThemes,
} from "@/lib/theme-compiler";

const THEMES_DIR = process.env.THEMES_DIR ?? path.join(process.cwd(), "src", "themes");

async function buildThemeEntry(slug: string, activeTheme: string, builtin: boolean) {
  const config = await readThemeConfig(slug);

  let compiled: boolean | null = null;
  if (!builtin) {
    try {
      const stats = await Promise.all(
        THEME_FILES.map((f) => fs.stat(path.join(THEME_CACHE_DIR, slug, `${f}.js`)).catch(() => null))
      );
      compiled = stats.every(Boolean);
    } catch {
      compiled = false;
    }
  }

  return {
    slug,
    name: (config.name as string | undefined) ?? slug,
    active: slug === activeTheme,
    builtin,
    compiled,
    version: config.version,
    author: config.author,
    description: config.description,
    capabilities: config.capabilities,
    overrides: config.overrides,
  };
}

export async function GET() {
  try {
    const activeRow = await db.select().from(settings).where(eq(settings.key, "activeTheme")).limit(1);
    const activeTheme = activeRow[0] ? JSON.parse(activeRow[0].value) : "default";

    const [builtinEntries, customSlugs] = await Promise.all([
      Promise.all(BUILT_IN_THEMES.map((slug) => buildThemeEntry(slug, activeTheme, true))),
      listCustomThemes(),
    ]);

    const customEntries = await Promise.all(
      customSlugs.map((slug) => buildThemeEntry(slug, activeTheme, false))
    );

    return ok([...builtinEntries, ...customEntries]);
  } catch (e) {
    return serverError(e);
  }
}

const createSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  base: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { slug, base } = parsed.data;

    if (isBuiltIn(slug)) return conflict(`"${slug}" is a reserved theme name`);

    // Check for duplicate
    const existing = await fs.stat(path.join(CUSTOM_THEMES_DIR, slug)).catch(() => null);
    if (existing) return conflict(`A theme named "${slug}" already exists`);

    // Validate base exists
    const baseDir = isBuiltIn(base)
      ? path.join(THEMES_DIR, base)
      : path.join(CUSTOM_THEMES_DIR, base);
    const baseExists = await fs.stat(baseDir).catch(() => null);
    if (!baseExists) return badRequest(`Base theme "${base}" not found`);

    await copyTheme(base, slug);
    const result = await compileTheme(slug);
    const config = await readThemeConfig(slug);

    return created({
      slug,
      builtin: false,
      compiled: result.ok,
      compileErrors: result.errors,
      ...config,
    });
  } catch (e) {
    return serverError(e);
  }
}

const activateSchema = z.object({ theme: z.string().min(1) });

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { theme } = parsed.data;

    const builtinDir = path.join(THEMES_DIR, theme);
    const customDir = path.join(CUSTOM_THEMES_DIR, theme);
    const [builtinExists, customExists] = await Promise.all([
      fs.stat(builtinDir).catch(() => null),
      fs.stat(customDir).catch(() => null),
    ]);
    if (!builtinExists && !customExists) return badRequest(`Theme "${theme}" not found`);

    const now = new Date();
    await db
      .insert(settings)
      .values({ key: "activeTheme", value: JSON.stringify(theme), updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value`, updatedAt: now } });

    return ok({ activated: theme });
  } catch (e) {
    return serverError(e);
  }
}
