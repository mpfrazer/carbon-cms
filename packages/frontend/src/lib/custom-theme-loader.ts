import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import type { ThemeComponents } from "@/lib/theme-provider";

const CUSTOM_THEMES_DIR = process.env.CUSTOM_THEMES_DIR ?? path.join(process.cwd(), "..", "..", "custom-themes");
const THEME_CACHE_DIR = path.join(CUSTOM_THEMES_DIR, ".cache");

const THEME_FILES = ["layout", "blog-index", "blog-post", "page", "search", "not-found"] as const;

const _require = createRequire(import.meta.url);

async function isCacheFresh(slug: string, file: string): Promise<boolean> {
  try {
    const [srcStat, cacheStat] = await Promise.all([
      fs.stat(path.join(CUSTOM_THEMES_DIR, slug, `${file}.tsx`)),
      fs.stat(path.join(THEME_CACHE_DIR, slug, `${file}.js`)),
    ]);
    return cacheStat.mtimeMs >= srcStat.mtimeMs;
  } catch {
    return false;
  }
}

function loadModule(slug: string, file: string): unknown {
  const modulePath = path.resolve(THEME_CACHE_DIR, slug, `${file}.js`);
  // Clear cache so stale compiled output is not reused after recompile
  delete _require.cache[modulePath];
  return _require(modulePath);
}

export async function loadCustomThemeComponents(slug: string): Promise<ThemeComponents | null> {
  // Verify all cached files exist and are fresh
  const freshChecks = await Promise.all(THEME_FILES.map((f) => isCacheFresh(slug, f)));
  if (!freshChecks.every(Boolean)) return null;

  try {
    const [layout, blogIndex, blogPost, page, search, notFound] = THEME_FILES.map((f) =>
      loadModule(slug, f)
    ) as Record<string, unknown>[];

    return {
      SiteLayout: (layout as Record<string, unknown>).SiteLayout as ThemeComponents["SiteLayout"],
      BlogIndex: (blogIndex as Record<string, unknown>).BlogIndex as ThemeComponents["BlogIndex"],
      BlogPost: (blogPost as Record<string, unknown>).BlogPost as ThemeComponents["BlogPost"],
      PageContent: (page as Record<string, unknown>).PageContent as ThemeComponents["PageContent"],
      PageBlocks: (page as Record<string, unknown>).PageBlocks as ThemeComponents["PageBlocks"],
      SearchPage: (search as Record<string, unknown>).SearchPage as ThemeComponents["SearchPage"],
      NotFound: (notFound as Record<string, unknown>).NotFound as ThemeComponents["NotFound"],
    };
  } catch {
    return null;
  }
}
