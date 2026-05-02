import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { isBuiltIn, CUSTOM_THEMES_DIR, THEME_CACHE_DIR, THEME_FILES, readThemeConfig } from "@/lib/theme-compiler";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  try {
    const config = await readThemeConfig(slug);
    const builtin = isBuiltIn(slug);

    let compiled: boolean | null = null;
    let compiledAt: string | null = null;
    if (!builtin) {
      try {
        // Check if all cache files exist
        const stats = await Promise.all(
          THEME_FILES.map((f) => fs.stat(path.join(THEME_CACHE_DIR, slug, `${f}.js`)).catch(() => null))
        );
        compiled = stats.every(Boolean);
        if (compiled) {
          const mtimes = stats.filter(Boolean).map((s) => s!.mtimeMs);
          compiledAt = new Date(Math.min(...mtimes)).toISOString();
        }
      } catch {
        compiled = false;
      }
    }

    return ok({ slug, builtin, compiled, compiledAt, ...config });
  } catch {
    return notFound(`Theme "${slug}" not found`);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  if (isBuiltIn(slug)) return badRequest("Built-in themes cannot be deleted");

  // Prevent deleting the active theme
  const activeRow = await db.select().from(settings).where(eq(settings.key, "activeTheme")).limit(1);
  const activeTheme = activeRow[0] ? JSON.parse(activeRow[0].value) : "default";
  if (activeTheme === slug) return badRequest("Cannot delete the active theme. Activate a different theme first.");

  try {
    await fs.rm(path.join(CUSTOM_THEMES_DIR, slug), { recursive: true, force: true });
    await fs.rm(path.join(THEME_CACHE_DIR, slug), { recursive: true, force: true }).catch(() => {});
    return ok({ deleted: slug });
  } catch (e) {
    return serverError(e);
  }
}
