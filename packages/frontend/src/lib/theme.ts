import { getFontByName } from "./fonts";

export interface ThemeAppearance {
  themeAccentColor: string;
  themeFontBody: string;
  themeFontHeading: string;
  themeHeadingWeight: string;
  themeLogoUrl: string | null;
  themeFooterText: string | null;
}

export const THEME_DEFAULTS: ThemeAppearance = {
  themeAccentColor: "#171717",
  themeFontBody: "system",
  themeFontHeading: "system",
  themeHeadingWeight: "700",
  themeLogoUrl: null,
  themeFooterText: null,
};

// Kept for backwards-compatibility with settings saved before the font registry
const LEGACY_FONT_STACKS: Record<string, string> = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "'Courier New', Courier, monospace",
};

function resolveFontStack(name: string): string {
  const font = getFontByName(name);
  if (font) return font.stack;
  return LEGACY_FONT_STACKS[name] ?? LEGACY_FONT_STACKS.system;
}

export function buildCssVars(appearance: Partial<ThemeAppearance>): string {
  const accent = appearance.themeAccentColor || THEME_DEFAULTS.themeAccentColor;
  const fontBody = resolveFontStack(appearance.themeFontBody ?? "system");
  const fontHeading = resolveFontStack(appearance.themeFontHeading ?? "system");
  const headingWeight = appearance.themeHeadingWeight || THEME_DEFAULTS.themeHeadingWeight;
  return [
    `--carbon-accent:${accent}`,
    `--carbon-font-body:${fontBody}`,
    `--carbon-font-heading:${fontHeading}`,
    `--carbon-font-heading-weight:${headingWeight}`,
  ].join(";");
}

export function parseThemeAppearance(raw: Record<string, unknown>): ThemeAppearance {
  return {
    themeAccentColor: (raw.themeAccentColor as string) || THEME_DEFAULTS.themeAccentColor,
    themeFontBody: (raw.themeFontBody as string) || THEME_DEFAULTS.themeFontBody,
    themeFontHeading: (raw.themeFontHeading as string) || THEME_DEFAULTS.themeFontHeading,
    themeHeadingWeight: (raw.themeHeadingWeight as string) || THEME_DEFAULTS.themeHeadingWeight,
    themeLogoUrl: (raw.themeLogoUrl as string) || null,
    themeFooterText: (raw.themeFooterText as string) || null,
  };
}
