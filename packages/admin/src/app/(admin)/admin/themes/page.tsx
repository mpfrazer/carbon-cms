import { Header } from "@/components/admin/header";
import { ThemesManager } from "@/components/admin/themes-manager";
import { serverGet } from "@/lib/api/server";

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
  preview?: string;
}

const APPEARANCE_KEYS = ["themeAccentColor", "themeFontBody", "themeFontHeading", "themeHeadingWeight", "themeLogoUrl", "themeFooterText"];

export default async function ThemesPage() {
  const [{ data: themes }, { data: appearance }] = await Promise.all([
    serverGet("/api/v1/themes") as Promise<{ data: Theme[] }>,
    serverGet(`/api/v1/settings?keys=${APPEARANCE_KEYS.join(",")}`) as Promise<{ data: Record<string, unknown> }>,
  ]);

  return (
    <div>
      <Header title="Themes" />
      <ThemesManager themes={themes} initialAppearance={appearance} />
    </div>
  );
}
