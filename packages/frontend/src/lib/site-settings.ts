import { apiGet } from "@/lib/api/client";
import { parseThemeAppearance, type ThemeAppearance } from "@/lib/theme";

export type NavItem =
  | { id: string; type: "page"; pageId: string; label: string }
  | { id: string; type: "link"; label: string; url: string };

export type SearchMode = "none" | "header" | "page";
export type SearchInputMode = "submit" | "instant";

export function parseSearchMode(raw: unknown): SearchMode {
  if (raw === "header" || raw === "page") return raw;
  return "none";
}

export function parseSearchInputMode(raw: unknown): SearchInputMode {
  if (raw === "instant") return "instant";
  return "submit";
}

export function parseShowBlogLink(raw: unknown): boolean {
  return raw !== false && raw !== "false";
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  postsPerPage: number;
  allowComments: boolean;
  requireLoginToComment: boolean;
  showBlogLink: boolean;
  appearance: ThemeAppearance;
  navMenu: NavItem[] | null;
  searchMode: SearchMode;
  searchInputMode: SearchInputMode;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data: raw } = await apiGet("/api/v1/settings") as { data: Record<string, unknown> };

  let navMenu: NavItem[] | null = null;
  if (raw.navMenu) {
    try {
      const parsed = Array.isArray(raw.navMenu) ? raw.navMenu : JSON.parse(raw.navMenu as string);
      if (Array.isArray(parsed)) navMenu = parsed as NavItem[];
    } catch { /* fall through */ }
  }

  return {
    siteTitle: (raw.siteTitle as string) || "Carbon CMS",
    siteDescription: (raw.siteDescription as string) || "",
    siteUrl: (raw.siteUrl as string) || "",
    postsPerPage: Number(raw.postsPerPage) || 10,
    allowComments: raw.allowComments !== false && raw.allowComments !== "false",
    requireLoginToComment: raw.requireLoginToComment === true || raw.requireLoginToComment === "true",
    showBlogLink: parseShowBlogLink(raw.showBlogLink),
    appearance: parseThemeAppearance(raw),
    navMenu,
    searchMode: parseSearchMode(raw.searchMode),
    searchInputMode: parseSearchInputMode(raw.searchInputMode),
  };
}
