import { getThemeComponents } from "@/lib/theme-provider";
import { apiGet } from "@/lib/api";

interface NavPage { slug: string; title: string; }

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, settings, navPages] = await Promise.all([
    getThemeComponents(),
    apiGet<{ data: { siteTitle?: string } }>("/api/v1/settings?keys=siteTitle"),
    apiGet<{ data: NavPage[] }>("/api/v1/pages?status=published&pageSize=50"),
  ]);

  const siteTitle = settings.data?.siteTitle ?? "Carbon CMS";
  const pages = (navPages.data ?? []).filter((p) => p.slug !== "home");

  return (
    <SiteLayout siteTitle={siteTitle} navPages={pages}>
      {children}
    </SiteLayout>
  );
}
