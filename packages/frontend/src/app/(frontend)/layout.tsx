import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { apiGet } from "@/lib/api/client";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, { siteTitle }, pagesRes] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    apiGet("/api/v1/pages?status=published&pageSize=50"),
  ]) as [Awaited<ReturnType<typeof getThemeComponents>>, Awaited<ReturnType<typeof getSiteSettings>>, { data: { slug: string; title: string }[] }];

  const navPages = pagesRes.data.filter((p) => p.slug !== "home");

  return (
    <SiteLayout siteTitle={siteTitle} navPages={navPages}>
      {children}
    </SiteLayout>
  );
}
