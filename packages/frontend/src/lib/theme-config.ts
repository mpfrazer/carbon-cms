import fs from "fs/promises";
import path from "path";
import type { SiteSettings, SearchMode, SearchInputMode } from "@/lib/site-settings";
import { getActiveTheme } from "@/lib/theme-provider";

const THEMES_DIR = process.env.THEMES_DIR ?? path.join(process.cwd(), "src", "themes");
const CUSTOM_THEMES_DIR = process.env.CUSTOM_THEMES_DIR ?? path.join(process.cwd(), "..", "..", "custom-themes");

export interface ThemeCapabilities {
  blog: boolean;
  search: { header: boolean; page: boolean };
  pageBuilder: boolean;
  comments: boolean;
}

export interface ThemeOverrides {
  searchMode?: SearchMode;
  searchInputMode?: SearchInputMode;
  showBlogLink?: boolean;
  postsPerPage?: number;
}

export interface ThemeConfig {
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  capabilities: ThemeCapabilities;
  overrides?: ThemeOverrides;
}

export const defaultThemeCapabilities: ThemeCapabilities = {
  blog: true,
  search: { header: true, page: true },
  pageBuilder: true,
  comments: true,
};

export const defaultThemeConfig: ThemeConfig = {
  capabilities: defaultThemeCapabilities,
};

function mergeWithDefaults(partial: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...partial,
    capabilities: {
      ...defaultThemeCapabilities,
      ...partial.capabilities,
      search: {
        ...defaultThemeCapabilities.search,
        ...partial.capabilities?.search,
      },
    },
  };
}

export async function getThemeConfig(): Promise<ThemeConfig> {
  const theme = await getActiveTheme();

  // Try built-in themes directory first
  try {
    const raw = await fs.readFile(path.join(THEMES_DIR, theme, "theme.config.json"), "utf-8");
    return mergeWithDefaults(JSON.parse(raw));
  } catch { /* not a built-in or no config */ }

  // Try custom themes directory
  try {
    const raw = await fs.readFile(path.join(CUSTOM_THEMES_DIR, theme, "theme.config.json"), "utf-8");
    return mergeWithDefaults(JSON.parse(raw));
  } catch { /* no config */ }

  return defaultThemeConfig;
}

export function applyThemeConfig(settings: SiteSettings, config: ThemeConfig): SiteSettings {
  const caps = config.capabilities;
  const overrides = config.overrides ?? {};

  let { searchMode, showBlogLink, allowComments, requireLoginToComment, commentModeration } = settings;

  if (!caps.blog) showBlogLink = false;

  if (!caps.search.header && !caps.search.page) {
    searchMode = "none";
  } else if (!caps.search.header && searchMode === "header") {
    searchMode = "none";
  } else if (!caps.search.page && searchMode === "page") {
    searchMode = "none";
  }

  if (!caps.comments) {
    allowComments = false;
    requireLoginToComment = false;
    commentModeration = false;
  }

  return {
    ...settings,
    showBlogLink: overrides.showBlogLink ?? showBlogLink,
    searchMode: overrides.searchMode ?? searchMode,
    searchInputMode: overrides.searchInputMode ?? settings.searchInputMode,
    postsPerPage: overrides.postsPerPage ?? settings.postsPerPage,
    allowComments,
    requireLoginToComment,
    commentModeration,
  };
}

export async function getEffectiveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  const config = await getThemeConfig();
  return applyThemeConfig(settings, config);
}
