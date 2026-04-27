import { describe, it, expect } from "vitest";
import { FONTS, getFontByName, buildGoogleFontsUrl } from "../fonts";

describe("FONTS registry", () => {
  it("has unique names", () => {
    const names = FONTS.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every Google font has a non-empty stack starting with the font name in quotes", () => {
    for (const f of FONTS) {
      if (f.googleFamily) {
        expect(f.stack).toMatch(/^'[^']+'/);
      }
    }
  });

  it("system fonts have null googleFamily", () => {
    expect(getFontByName("system")?.googleFamily).toBeNull();
    expect(getFontByName("system-serif")?.googleFamily).toBeNull();
    expect(getFontByName("system-mono")?.googleFamily).toBeNull();
  });

  it("display-serif fonts are heading-only", () => {
    const displayFonts = FONTS.filter((f) => f.category === "display-serif");
    expect(displayFonts.length).toBeGreaterThan(0);
    for (const f of displayFonts) {
      expect(f.contexts).not.toContain("body");
      expect(f.contexts).toContain("heading");
    }
  });

  it("mono fonts are body-only", () => {
    const monoFonts = FONTS.filter((f) => f.category === "mono");
    expect(monoFonts.length).toBeGreaterThan(0);
    for (const f of monoFonts) {
      expect(f.contexts).not.toContain("heading");
      expect(f.contexts).toContain("body");
    }
  });
});

describe("getFontByName", () => {
  it("returns the correct font for a known name", () => {
    const font = getFontByName("inter");
    expect(font?.label).toBe("Inter");
    expect(font?.googleFamily).toBe("Inter");
  });

  it("returns undefined for an unknown name", () => {
    expect(getFontByName("not-a-real-font")).toBeUndefined();
  });
});

describe("buildGoogleFontsUrl", () => {
  it("returns null when all fonts are system fonts", () => {
    expect(buildGoogleFontsUrl(["system", "system-serif"])).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(buildGoogleFontsUrl([])).toBeNull();
  });

  it("includes the correct family in the URL", () => {
    const url = buildGoogleFontsUrl(["inter"]);
    expect(url).not.toBeNull();
    expect(url).toContain("family=Inter");
    expect(url).toContain("display=swap");
  });

  it("includes multiple families in one URL", () => {
    const url = buildGoogleFontsUrl(["inter", "playfair-display"]);
    expect(url).not.toBeNull();
    expect(url).toContain("family=Inter");
    expect(url).toContain("Playfair");
  });

  it("skips system fonts and only includes Google Fonts", () => {
    const url = buildGoogleFontsUrl(["system", "lora"]);
    expect(url).not.toBeNull();
    expect(url).toContain("family=Lora");
    expect(url).not.toContain("family=system");
  });

  it("percent-encodes font names with spaces", () => {
    const url = buildGoogleFontsUrl(["plus-jakarta-sans"]);
    expect(url).toContain("Plus%20Jakarta%20Sans");
  });
});
