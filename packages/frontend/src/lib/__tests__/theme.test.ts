import { describe, it, expect } from "vitest";
import { buildCssVars, THEME_DEFAULTS } from "../theme";

describe("buildCssVars", () => {
  it("returns defaults when given an empty object", () => {
    const result = buildCssVars({});
    expect(result).toContain("--carbon-accent:#171717");
    expect(result).toContain("--carbon-font-body:system-ui");
    expect(result).toContain("--carbon-font-heading:system-ui");
  });

  it("uses a custom accent color", () => {
    const result = buildCssVars({ themeAccentColor: "#3b82f6" });
    expect(result).toContain("--carbon-accent:#3b82f6");
  });

  it("maps serif body font to the correct stack", () => {
    const result = buildCssVars({ themeFontBody: "serif" });
    expect(result).toContain("--carbon-font-body:Georgia");
  });

  it("maps mono body font to the correct stack", () => {
    const result = buildCssVars({ themeFontBody: "mono" });
    expect(result).toContain("--carbon-font-body:'Courier New'");
  });

  it("maps serif heading font to the correct stack", () => {
    const result = buildCssVars({ themeFontHeading: "serif" });
    expect(result).toContain("--carbon-font-heading:Georgia");
  });

  it("handles all overrides together", () => {
    const result = buildCssVars({
      themeAccentColor: "#e11d48",
      themeFontBody: "serif",
      themeFontHeading: "serif",
    });
    expect(result).toContain("--carbon-accent:#e11d48");
    expect(result).toContain("--carbon-font-body:Georgia");
    expect(result).toContain("--carbon-font-heading:Georgia");
  });

  it("defaults match THEME_DEFAULTS", () => {
    const result = buildCssVars({});
    expect(result).toContain(`--carbon-accent:${THEME_DEFAULTS.themeAccentColor}`);
  });
});
