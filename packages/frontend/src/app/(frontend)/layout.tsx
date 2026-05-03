import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { getEffectiveSiteSettings, getThemeVars, buildThemeVarsCss } from "@/lib/theme-config";
import { buildCssVars } from "@/lib/theme";
import { buildGoogleFontsUrl } from "@/lib/fonts";
import { apiGet } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import type { SiteLayout as SiteLayoutType } from "@/themes/default/layout";

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, rawSettings, pagesRes, session, themeVarsData] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    apiGet("/api/v1/pages?status=published&pageSize=50") as Promise<{ data: { slug: string; title: string }[] }>,
    auth(),
    getThemeVars(),
  ]);

  const Layout = SiteLayout as typeof SiteLayoutType;
  const allPages = (pagesRes as { data: { id: string; slug: string; title: string }[] }).data;
  const pageById = Object.fromEntries(allPages.map((p) => [p.id, p]));

  // Build nav from saved navMenu setting; fall back to all published pages (minus home) for
  // installs that haven't configured the nav editor yet.
  let navPages: { label: string; href: string }[];
  if (rawSettings.navMenu && rawSettings.navMenu.length > 0) {
    navPages = rawSettings.navMenu.flatMap((item) => {
      if (item.type === "page") {
        const page = pageById[item.pageId];
        if (!page) return []; // deleted page — skip
        return [{ label: item.label || page.title, href: page.slug === "home" ? "/" : `/${page.slug}` }];
      }
      return [{ label: item.label, href: item.url }];
    });
  } else {
    navPages = allPages
      .filter((p) => p.slug !== "home")
      .map((p) => ({ label: p.title, href: `/${p.slug}` }));
  }
  const settings = await getEffectiveSiteSettings(rawSettings);

  const appearanceVars = buildCssVars(rawSettings.appearance);
  const themeVarsCss = buildThemeVarsCss(themeVarsData.values);
  const customVarsCss = rawSettings.customCssVars ? buildThemeVarsCss(rawSettings.customCssVars) : "";
  const allCssVars = [appearanceVars, themeVarsCss, customVarsCss].filter(Boolean).join(";");

  const googleFontsUrl = buildGoogleFontsUrl([
    rawSettings.appearance.themeFontBody,
    rawSettings.appearance.themeFontHeading,
  ]);

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
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
          <link rel="stylesheet" href={googleFontsUrl} />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: `:root{${allCssVars}}h1,h2,h3,h4,h5,h6{font-weight:var(--carbon-font-heading-weight)}` }} />
      <Layout
        siteTitle={settings.siteTitle}
        navPages={navPages}
        searchMode={settings.searchMode}
        searchInputMode={settings.searchInputMode}
        showBlogLink={settings.showBlogLink}
        user={user}
        logoUrl={settings.appearance.themeLogoUrl}
        footerText={settings.appearance.themeFooterText}
      >
        {children}
      </Layout>
    </>
  );
}
