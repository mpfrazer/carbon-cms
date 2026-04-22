import type { ComponentType } from "react";

// Cache the active theme name for SSR mode (short TTL avoids stale reads after activation)
let cachedTheme: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5_000;

export async function getActiveTheme(): Promise<string> {
  const renderMode = process.env.CARBON_RENDER_MODE ?? "ssr";

  // In CSR/static mode the theme is baked in at build time via ACTIVE_THEME env var
  if (renderMode === "csr") {
    return process.env.ACTIVE_THEME ?? "default";
  }

  // SSR: read from API with short-lived in-memory cache
  const now = Date.now();
  if (cachedTheme && now < cacheExpiry) return cachedTheme;

  try {
    const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
    const internalSecret = process.env.CARBON_INTERNAL_SECRET ?? "";
    const res = await fetch(`${apiUrl}/api/v1/settings?keys=activeTheme`, {
      headers: { "X-Carbon-Internal": internalSecret },
      next: { revalidate: 5 },
    });
    if (res.ok) {
      const json = await res.json();
      cachedTheme = json.data?.activeTheme ?? "default";
      cacheExpiry = now + CACHE_TTL_MS;
      return cachedTheme!;
    }
  } catch {
    // fall through to default
  }

  return "default";
}

export interface ThemeComponents {
  SiteLayout: ComponentType<{ siteTitle: string; navPages: { slug: string; title: string }[]; children: React.ReactNode }>;
  BlogIndex: ComponentType<{ posts: unknown[]; page: number; totalPages: number }>;
  BlogPost: ComponentType<{ title: string; content: string; publishedAt: Date | null; createdAt: Date; authorName: string | null; categories: unknown[]; tags: unknown[] }>;
  PageContent: ComponentType<{ title: string; content: string; updatedAt: Date }>;
}

export async function getThemeComponents(): Promise<ThemeComponents> {
  const theme = await getActiveTheme();

  // Dynamic import so only the active theme is loaded at request time.
  // Next.js will bundle all candidate themes at build time in CSR mode,
  // but tree-shakes in SSR mode since the import is evaluated at runtime.
  try {
    const [layout, blogIndex, blogPost, page] = await Promise.all([
      import(`../themes/${theme}/layout`),
      import(`../themes/${theme}/blog-index`),
      import(`../themes/${theme}/blog-post`),
      import(`../themes/${theme}/page`),
    ]);
    return {
      SiteLayout: layout.SiteLayout,
      BlogIndex: blogIndex.BlogIndex,
      BlogPost: blogPost.BlogPost,
      PageContent: page.PageContent,
    };
  } catch {
    // Fall back to default theme if the requested theme fails to load
    const [layout, blogIndex, blogPost, page] = await Promise.all([
      import("../themes/default/layout"),
      import("../themes/default/blog-index"),
      import("../themes/default/blog-post"),
      import("../themes/default/page"),
    ]);
    return {
      SiteLayout: layout.SiteLayout,
      BlogIndex: blogIndex.BlogIndex,
      BlogPost: blogPost.BlogPost,
      PageContent: page.PageContent,
    };
  }
}
