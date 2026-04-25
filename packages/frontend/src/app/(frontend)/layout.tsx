import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { buildCssVars } from "@/lib/theme";
import { apiGet } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { SiteLayout as SiteLayoutType } from "@/themes/default/layout";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, settings, pagesRes, session] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    apiGet("/api/v1/pages?status=published&pageSize=50") as Promise<{ data: { slug: string; title: string }[] }>,
    auth(),
  ]);

  const Layout = SiteLayout as typeof SiteLayoutType;
  const navPages = (pagesRes as { data: { slug: string; title: string }[] }).data.filter((p) => p.slug !== "home");
  const cssVars = buildCssVars(settings.appearance);

  let user: { name: string; role: string; avatarUrl?: string | null } | null = null;
  if (session?.user?.id && session.user.name) {
    let avatarUrl: string | null = null;
    try {
      const { data: userData } = await apiGet(`/api/v1/users/${session.user.id}`) as { data: { avatarUrl?: string | null } };
      avatarUrl = userData.avatarUrl ?? null;
    } catch { /* non-critical */ }
    user = { name: session.user.name, role: (session.user as { role?: string }).role ?? "subscriber", avatarUrl };
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root{${cssVars}}` }} />
      <Layout
        siteTitle={settings.siteTitle}
        navPages={navPages}
        user={user}
        logoUrl={settings.appearance.themeLogoUrl}
        footerText={settings.appearance.themeFooterText}
      >
        {children}
      </Layout>
    </>
  );
}
