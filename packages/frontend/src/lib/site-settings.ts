import { apiGet } from "@/lib/api/client";
import { parseThemeAppearance, type ThemeAppearance } from "@/lib/theme";

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  postsPerPage: number;
  allowComments: boolean;
  requireLoginToComment: boolean;
  appearance: ThemeAppearance;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data: raw } = await apiGet("/api/v1/settings") as { data: Record<string, unknown> };
  return {
    siteTitle: (raw.siteTitle as string) || "Carbon CMS",
    siteDescription: (raw.siteDescription as string) || "",
    siteUrl: (raw.siteUrl as string) || "",
    postsPerPage: Number(raw.postsPerPage) || 10,
    allowComments: raw.allowComments !== false && raw.allowComments !== "false",
    requireLoginToComment: raw.requireLoginToComment === true || raw.requireLoginToComment === "true",
    appearance: parseThemeAppearance(raw),
  };
}
