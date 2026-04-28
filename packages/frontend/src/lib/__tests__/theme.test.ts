import { describe, it, expect } from "vitest";
import { buildCssVars, THEME_DEFAULTS } from "../theme";

describe("buildCssVars", () => {
  it("returns defaults when given an empty object", () => {
    const result = buildCssVars({});
    expect(result).toContain("--carbon-accent:#171717");
    expect(result).toContain("--carbon-font-body:system-ui");
    expect(result).toContain("--carbon-font-heading:system-ui");
    expect(result).toContain("--carbon-font-heading-weight:700");
  });

  it("uses a custom accent color", () => {
    const result = buildCssVars({ themeAccentColor: "#3b82f6" });
    expect(result).toContain("--carbon-accent:#3b82f6");
  });

  // Legacy font name backwards-compatibility
  it("maps legacy 'serif' body font to Georgia stack", () => {
    const result = buildCssVars({ themeFontBody: "serif" });
    expect(result).toContain("--carbon-font-body:Georgia");
  });

  it("maps legacy 'mono' body font to Courier stack", () => {
    const result = buildCssVars({ themeFontBody: "mono" });
    expect(result).toContain("--carbon-font-body:'Courier New'");
  });

  it("maps legacy 'serif' heading font to Georgia stack", () => {
    const result = buildCssVars({ themeFontHeading: "serif" });
    expect(result).toContain("--carbon-font-heading:Georgia");
  });

  // Font registry lookup
  it("resolves 'inter' to the Inter font stack", () => {
    const result = buildCssVars({ themeFontBody: "inter" });
    expect(result).toContain("--carbon-font-body:'Inter'");
  });

  it("resolves 'playfair-display' heading to the Playfair stack", () => {
    const result = buildCssVars({ themeFontHeading: "playfair-display" });
    expect(result).toContain("--carbon-font-heading:'Playfair Display'");
  });

  it("resolves 'lora' body font to the Lora stack", () => {
    const result = buildCssVars({ themeFontBody: "lora" });
    expect(result).toContain("--carbon-font-body:'Lora'");
  });

  it("resolves 'space-grotesk' to the Space Grotesk stack", () => {
    const result = buildCssVars({ themeFontBody: "space-grotesk" });
    expect(result).toContain("--carbon-font-body:'Space Grotesk'");
  });

  it("applies custom heading weight", () => {
    const result = buildCssVars({ themeHeadingWeight: "400" });
    expect(result).toContain("--carbon-font-heading-weight:400");
  });

  it("handles all overrides together", () => {
    const result = buildCssVars({
      themeAccentColor: "#e11d48",
      themeFontBody: "inter",
      themeFontHeading: "playfair-display",
      themeHeadingWeight: "600",
    });
    expect(result).toContain("--carbon-accent:#e11d48");
    expect(result).toContain("--carbon-font-body:'Inter'");
    expect(result).toContain("--carbon-font-heading:'Playfair Display'");
    expect(result).toContain("--carbon-font-heading-weight:600");
  });

  it("defaults match THEME_DEFAULTS accent color", () => {
    const result = buildCssVars({});
    expect(result).toContain(`--carbon-accent:${THEME_DEFAULTS.themeAccentColor}`);
  });

  it("falls back to system stack for unknown font name", () => {
    const result = buildCssVars({ themeFontBody: "unknown-font-xyz" });
    expect(result).toContain("--carbon-font-body:system-ui");
  });
});
