import type { ComponentType } from "react";
import { apiGet, serverApiPost } from "@/lib/api/client";
import type { PageBlock } from "@/lib/blocks";
import type { SearchMode, SearchInputMode } from "@/lib/site-settings";
import { loadCustomThemeComponents } from "@/lib/custom-theme-loader";
import { z } from "zod";
import { registerTemplate, type FrontendTemplate } from "@/templates";

export interface SearchResult {
  type: "post" | "page";
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  url: string;
}

export interface SearchPageProps {
  query: string;
  results: SearchResult[];
  total: number;
  inputMode: SearchInputMode;
}

export interface ThemeComponents {
  SiteLayout: ComponentType<{
    siteTitle: string;
    navPages: { label: string; href: string }[];
    searchMode: SearchMode;
    searchInputMode: SearchInputMode;
    children: React.ReactNode;
    user?: { name: string; role: string; avatarUrl?: string | null } | null;
    logoUrl?: string | null;
    footerText?: string | null;
    simplified?: boolean;
    showBlogLink?: boolean;
  }>;
  BlogIndex: ComponentType<any>;
  BlogPost: ComponentType<any>;
  PageContent: ComponentType<{ title: string; content: string; updatedAt: Date }>;
  PageBlocks: ComponentType<{ title: string; blocks: PageBlock[] }>;
  SearchPage: ComponentType<SearchPageProps>;
  NotFound: ComponentType;
}

const BUILT_IN_THEMES = ["default", "minimal", "library"];

// Themes whose templates module ships contributed templates. Listed
// explicitly so the dynamic import below doesn't error for themes that
// don't have a templates file. Kept in sync with files on disk by the
// drift test in the API package's template tests.
const THEMES_WITH_TEMPLATES = new Set(["library"]);

interface ThemeContributedTemplate {
  kind: string;
  label: string;
  description?: string;
  schema: z.ZodObject<z.ZodRawShape>;
  template: FrontendTemplate;
}

// Process-wide cache so we only register a theme's manifests with the API
// once per process per theme — the lazy registration approach described in
// docs/architecture/post-templates.md.
const registeredThemes = new Set<string>();

async function loadAndRegisterContributedTemplates(themeId: string): Promise<void> {
  if (!THEMES_WITH_TEMPLATES.has(themeId)) return;

  let mod: { templates?: ThemeContributedTemplate[] };
  try {
    mod = await import(`../themes/${themeId}/templates`);
  } catch (e) {
    console.warn(`[carbon] theme "${themeId}" declared templates but the module failed to load:`, e);
    return;
  }
  const contributed = mod.templates ?? [];
  if (contributed.length === 0) return;

  // Always register locally so renders work in this process even if the
  // API call fails — render fallback is the only consequence of a missing
  // server-side schema.
  for (const c of contributed) {
    registerTemplate(c.template);
  }

  // Idempotent server-side registration. Skip if we've already done it
  // for this theme in this process.
  if (registeredThemes.has(themeId)) return;
  registeredThemes.add(themeId);

  try {
    const manifest = contributed.map((c) => ({
      kind: c.kind,
      label: c.label,
      description: c.description,
      jsonSchema: z.toJSONSchema(c.schema) as Record<string, unknown>,
    }));
    await serverApiPost("/api/v1/templates/register", { themeId, templates: manifest });
  } catch (e) {
    // Leave the entry in the cache so we don't hammer the API on every
    // request. Operator can restart the frontend service or hit the
    // endpoint manually to recover.
    console.warn(`[carbon] failed to register templates for theme "${themeId}":`, e);
  }
}

export async function getActiveTheme(): Promise<string> {
  try {
    const { data } = await apiGet("/api/v1/settings?keys=activeTheme") as { data: { activeTheme?: string } };
    return data.activeTheme ?? "default";
  } catch {
    return "default";
  }
}

async function loadBuiltInTheme(theme: string): Promise<ThemeComponents> {
  const [layout, blogIndex, blogPost, page, search, notFound] = await Promise.all([
    import(`../themes/${theme}/layout`),
    import(`../themes/${theme}/blog-index`),
    import(`../themes/${theme}/blog-post`),
    import(`../themes/${theme}/page`),
    import(`../themes/${theme}/search`),
    import(`../themes/${theme}/not-found`),
  ]);
  return {
    SiteLayout: layout.SiteLayout,
    BlogIndex: blogIndex.BlogIndex,
    BlogPost: blogPost.BlogPost,
    PageContent: page.PageContent,
    PageBlocks: page.PageBlocks,
    SearchPage: search.SearchPage,
    NotFound: notFound.NotFound,
  };
}

async function loadDefaultTheme(): Promise<ThemeComponents> {
  const [layout, blogIndex, blogPost, page, search, notFound] = await Promise.all([
    import("../themes/default/layout"),
    import("../themes/default/blog-index"),
    import("../themes/default/blog-post"),
    import("../themes/default/page"),
    import("../themes/default/search"),
    import("../themes/default/not-found"),
  ]);
  return {
    SiteLayout: layout.SiteLayout,
    BlogIndex: blogIndex.BlogIndex,
    BlogPost: blogPost.BlogPost,
    PageContent: page.PageContent,
    PageBlocks: page.PageBlocks,
    SearchPage: search.SearchPage,
    NotFound: notFound.NotFound,
  };
}

export async function getThemeComponents(): Promise<ThemeComponents> {
  const theme = await getActiveTheme();

  // Fire-and-forget — template registration must never block rendering.
  // It's idempotent and cached, so concurrent requests are safe.
  void loadAndRegisterContributedTemplates(theme);

  // Custom theme: load compiled output via createRequire
  if (!BUILT_IN_THEMES.includes(theme)) {
    const custom = await loadCustomThemeComponents(theme);
    if (custom) return custom;
    // Custom theme not compiled or stale — fall back to default
    console.warn(`[carbon] Custom theme "${theme}" not compiled or stale — falling back to default.`);
    return loadDefaultTheme();
  }

  // Built-in theme: use webpack-bundled dynamic imports
  try {
    return await loadBuiltInTheme(theme);
  } catch {
    return loadDefaultTheme();
  }
}
