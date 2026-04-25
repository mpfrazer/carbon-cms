export interface ThemeAppearance {
  themeAccentColor: string;
  themeFontBody: "system" | "serif" | "mono";
  themeFontHeading: "system" | "serif";
  themeLogoUrl: string | null;
  themeFooterText: string | null;
}

export const THEME_DEFAULTS: ThemeAppearance = {
  themeAccentColor: "#171717",
  themeFontBody: "system",
  themeFontHeading: "system",
  themeLogoUrl: null,
  themeFooterText: null,
};

const FONT_STACKS: Record<string, string> = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "'Courier New', Courier, monospace",
};

export function buildCssVars(appearance: Partial<ThemeAppearance>): string {
  const accent = appearance.themeAccentColor || THEME_DEFAULTS.themeAccentColor;
  const fontBody = FONT_STACKS[appearance.themeFontBody ?? "system"] ?? FONT_STACKS.system;
  const fontHeading = FONT_STACKS[appearance.themeFontHeading ?? "system"] ?? FONT_STACKS.system;
  return [
    `--carbon-accent:${accent}`,
    `--carbon-font-body:${fontBody}`,
    `--carbon-font-heading:${fontHeading}`,
  ].join(";");
}

export function parseThemeAppearance(raw: Record<string, unknown>): ThemeAppearance {
  return {
    themeAccentColor: (raw.themeAccentColor as string) || THEME_DEFAULTS.themeAccentColor,
    themeFontBody: (raw.themeFontBody as ThemeAppearance["themeFontBody"]) || THEME_DEFAULTS.themeFontBody,
    themeFontHeading: (raw.themeFontHeading as ThemeAppearance["themeFontHeading"]) || THEME_DEFAULTS.themeFontHeading,
    themeLogoUrl: (raw.themeLogoUrl as string) || null,
    themeFooterText: (raw.themeFooterText as string) || null,
  };
}
