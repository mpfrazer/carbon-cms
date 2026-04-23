import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, { siteTitle }, navPages] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    db.select({ slug: pages.slug, title: pages.title })
      .from(pages)
      .where(eq(pages.status, "published"))
      .orderBy(asc(pages.menuOrder), asc(pages.title))
      .limit(50),
  ]);

  const filteredPages = navPages.filter((p) => p.slug !== "home");

  return (
    <SiteLayout siteTitle={siteTitle} navPages={filteredPages}>
      {children}
    </SiteLayout>
  );
}
