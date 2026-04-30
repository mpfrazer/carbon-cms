import type { ComponentType } from "react";
import { apiGet } from "@/lib/api/client";
import type { PageBlock } from "@/lib/blocks";
import type { SearchMode, SearchInputMode } from "@/lib/site-settings";

// TODO: Write theme-building documentation covering:
//   - The ThemeComponents interface and required exports per theme
//   - How themes consume SiteLayout props (navPages, searchMode, searchInputMode, simplified, etc.)
//   - Theme directory structure (layout, blog-index, blog-post, page, search, not-found, globals.css)
//   - How to use CSS variables (--carbon-accent, --carbon-font-body, etc.) from the appearance settings
//   - The fallback chain: active theme → default theme

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
  }>;
  BlogIndex: ComponentType<any>;
  BlogPost: ComponentType<any>;
  PageContent: ComponentType<{ title: string; content: string; updatedAt: Date }>;
  PageBlocks: ComponentType<{ title: string; blocks: PageBlock[] }>;
  SearchPage: ComponentType<SearchPageProps>;
  NotFound: ComponentType;
}

export async function getActiveTheme(): Promise<string> {
  try {
    const { data } = await apiGet("/api/v1/settings?keys=activeTheme") as { data: { activeTheme?: string } };
    return data.activeTheme ?? "default";
  } catch {
    return "default";
  }
}

export async function getThemeComponents(): Promise<ThemeComponents> {
  const theme = await getActiveTheme();

  try {
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
  } catch {
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
}
