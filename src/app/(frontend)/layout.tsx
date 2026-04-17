import { SiteLayout } from "@/themes/default/layout";
import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, isNull, asc, and } from "drizzle-orm";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [siteSettings, navPages] = await Promise.all([
    getSiteSettings(),
    db.select({ slug: pages.slug, title: pages.title })
      .from(pages)
      .where(and(eq(pages.status, "published"), isNull(pages.parentId)))
      .orderBy(asc(pages.menuOrder), asc(pages.title)),
  ]);

  return (
    <SiteLayout siteTitle={siteSettings.siteTitle} navPages={navPages}>
      {children}
    </SiteLayout>
  );
}
