import type { ComponentType } from "react";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getActiveTheme(): Promise<string> {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "activeTheme"))
      .limit(1);
    return row ? JSON.parse(row.value) : "default";
  } catch {
    return "default";
  }
}

export interface ThemeComponents {
  SiteLayout: ComponentType<{ siteTitle: string; navPages: { slug: string; title: string }[]; children: React.ReactNode }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BlogIndex: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  BlogPost: ComponentType<any>;
  PageContent: ComponentType<{ title: string; content: string; updatedAt: Date }>;
}

export async function getThemeComponents(): Promise<ThemeComponents> {
  const theme = await getActiveTheme();

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
