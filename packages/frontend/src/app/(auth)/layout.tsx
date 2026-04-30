import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { buildCssVars } from "@/lib/theme";
import { buildGoogleFontsUrl } from "@/lib/fonts";
import type { SiteLayout as SiteLayoutType } from "@/themes/default/layout";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [{ SiteLayout }, settings] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
  ]);

  const Layout = SiteLayout as typeof SiteLayoutType;

  const cssVars = buildCssVars(settings.appearance);
  const googleFontsUrl = buildGoogleFontsUrl([
    settings.appearance.themeFontBody,
    settings.appearance.themeFontHeading,
  ]);

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
      <style dangerouslySetInnerHTML={{ __html: `:root{${cssVars}}h1,h2,h3,h4,h5,h6{font-weight:var(--carbon-font-heading-weight)}` }} />
      <Layout
        siteTitle={settings.siteTitle}
        navPages={[]}
        searchMode="none"
        searchInputMode="submit"
        logoUrl={settings.appearance.themeLogoUrl}
        footerText={settings.appearance.themeFooterText}
        simplified={true}
      >
        {children}
      </Layout>
    </>
  );
}
