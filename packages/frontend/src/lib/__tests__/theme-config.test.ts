import { describe, it, expect } from "vitest";
import { applyThemeConfig, defaultThemeConfig, resolveThemeVars, buildThemeVarsCss } from "../theme-config";
import type { ThemeVariableDefinition } from "../theme-config";
import type { SiteSettings } from "../site-settings";

const baseSettings: SiteSettings = {
  siteTitle: "Test",
  siteDescription: "",
  siteUrl: "",
  postsPerPage: 10,
  allowComments: true,
  requireLoginToComment: false,
  commentModeration: true,
  showBlogLink: true,
  appearance: {
    themeAccentColor: "#000",
    themeFontBody: "system",
    themeFontHeading: "system",
    themeHeadingWeight: "700",
    themeLogoUrl: null,
    themeFooterText: null,
  },
  navMenu: null,
  searchMode: "header",
  searchInputMode: "submit",
};

describe("applyThemeConfig — no-op on default config", () => {
  it("returns settings unchanged when all capabilities are on", () => {
    const result = applyThemeConfig(baseSettings, defaultThemeConfig);
    expect(result.showBlogLink).toBe(true);
    expect(result.searchMode).toBe("header");
    expect(result.allowComments).toBe(true);
  });
});

describe("applyThemeConfig — blog capability", () => {
  it("forces showBlogLink false when blog is disabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, blog: false } };
    const result = applyThemeConfig(baseSettings, config);
    expect(result.showBlogLink).toBe(false);
  });

  it("leaves showBlogLink true when blog is enabled", () => {
    const result = applyThemeConfig(baseSettings, defaultThemeConfig);
    expect(result.showBlogLink).toBe(true);
  });
});

describe("applyThemeConfig — search capability", () => {
  it("forces searchMode to none when both search placements are disabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, search: { header: false, page: false } } };
    const result = applyThemeConfig(baseSettings, config);
    expect(result.searchMode).toBe("none");
  });

  it("overrides header searchMode to none when header is disabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, search: { header: false, page: true } } };
    const result = applyThemeConfig({ ...baseSettings, searchMode: "header" }, config);
    expect(result.searchMode).toBe("none");
  });

  it("overrides page searchMode to none when page is disabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, search: { header: true, page: false } } };
    const result = applyThemeConfig({ ...baseSettings, searchMode: "page" }, config);
    expect(result.searchMode).toBe("none");
  });

  it("preserves page searchMode when header is disabled but page is enabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, search: { header: false, page: true } } };
    const result = applyThemeConfig({ ...baseSettings, searchMode: "page" }, config);
    expect(result.searchMode).toBe("page");
  });

  it("preserves header searchMode when page is disabled but header is enabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, search: { header: true, page: false } } };
    const result = applyThemeConfig({ ...baseSettings, searchMode: "header" }, config);
    expect(result.searchMode).toBe("header");
  });
});

describe("applyThemeConfig — comments capability", () => {
  it("forces allowComments false when comments are disabled", () => {
    const config = { ...defaultThemeConfig, capabilities: { ...defaultThemeConfig.capabilities, comments: false } };
    const result = applyThemeConfig(baseSettings, config);
    expect(result.allowComments).toBe(false);
    expect(result.requireLoginToComment).toBe(false);
    expect(result.commentModeration).toBe(false);
  });

  it("preserves allowComments when comments are enabled", () => {
    const result = applyThemeConfig(baseSettings, defaultThemeConfig);
    expect(result.allowComments).toBe(true);
    expect(result.commentModeration).toBe(true);
  });
});

describe("applyThemeConfig — overrides", () => {
  it("applies searchMode override", () => {
    const config = { ...defaultThemeConfig, overrides: { searchMode: "page" as const } };
    const result = applyThemeConfig({ ...baseSettings, searchMode: "none" }, config);
    expect(result.searchMode).toBe("page");
  });

  it("applies showBlogLink override even when blog capability is on", () => {
    const config = { ...defaultThemeConfig, overrides: { showBlogLink: false } };
    const result = applyThemeConfig(baseSettings, config);
    expect(result.showBlogLink).toBe(false);
  });

  it("applies postsPerPage override", () => {
    const config = { ...defaultThemeConfig, overrides: { postsPerPage: 5 } };
    const result = applyThemeConfig(baseSettings, config);
    expect(result.postsPerPage).toBe(5);
  });

  it("overrides take precedence over capability enforcement", () => {
    // Even if header search is disabled, an explicit override to "header" wins
    const config = {
      ...defaultThemeConfig,
      capabilities: { ...defaultThemeConfig.capabilities, search: { header: false, page: true } },
      overrides: { searchMode: "header" as const },
    };
    const result = applyThemeConfig(baseSettings, config);
    expect(result.searchMode).toBe("header");
  });
});

const colorVar: ThemeVariableDefinition = { key: "primaryColor", label: "Primary Color", type: "color", default: "#3b82f6" };
const selectVar: ThemeVariableDefinition = { key: "layout", label: "Layout", type: "select", default: "centered", options: ["centered", "wide"] };
const numVar: ThemeVariableDefinition = { key: "fontSize", label: "Font Size", type: "number", default: 16 };

describe("resolveThemeVars", () => {
  it("returns defaults when stored is empty", () => {
    const result = resolveThemeVars([colorVar, selectVar], {});
    expect(result).toEqual({ primaryColor: "#3b82f6", layout: "centered" });
  });

  it("uses stored value over default", () => {
    const result = resolveThemeVars([colorVar], { primaryColor: "#ff0000" });
    expect(result.primaryColor).toBe("#ff0000");
  });

  it("preserves stored false-y values (empty string, 0)", () => {
    const result = resolveThemeVars([colorVar, numVar], { primaryColor: "", fontSize: 0 });
    expect(result.primaryColor).toBe("");
    expect(result.fontSize).toBe(0);
  });

  it("returns empty object for empty variable list", () => {
    expect(resolveThemeVars([], { primaryColor: "#ff0000" })).toEqual({});
  });

  it("ignores stored keys not in variable definitions", () => {
    const result = resolveThemeVars([colorVar], { primaryColor: "#ff0000", unknown: "ignored" });
    expect(result).toEqual({ primaryColor: "#ff0000" });
  });
});

describe("buildThemeVarsCss", () => {
  it("builds CSS custom properties string", () => {
    const css = buildThemeVarsCss({ primaryColor: "#3b82f6", layout: "centered" });
    expect(css).toContain("--primaryColor:#3b82f6");
    expect(css).toContain("--layout:centered");
  });

  it("returns empty string for empty object", () => {
    expect(buildThemeVarsCss({})).toBe("");
  });

  it("converts numbers to string", () => {
    expect(buildThemeVarsCss({ fontSize: 16 })).toBe("--fontSize:16");
  });
});
