import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { apiGet } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { SiteLayout as SiteLayoutType } from "@/themes/default/layout";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, { siteTitle }, pagesRes, session] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    apiGet("/api/v1/pages?status=published&pageSize=50") as Promise<{ data: { slug: string; title: string }[] }>,
    auth(),
  ]);

  const Layout = SiteLayout as typeof SiteLayoutType;
  const navPages = (pagesRes as { data: { slug: string; title: string }[] }).data.filter((p) => p.slug !== "home");
  const user = session?.user?.name ? { name: session.user.name } : null;

  return (
    <Layout siteTitle={siteTitle} navPages={navPages} user={user}>
      {children}
    </Layout>
  );
}
