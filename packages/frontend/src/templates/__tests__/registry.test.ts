import { describe, it, expect } from "vitest";
import { article, getTemplate, listTemplates } from "..";

describe("frontend template registry", () => {
  it("registers the article template at module load", () => {
    expect(getTemplate("article")).toBeDefined();
  });

  it("article template has a Render component", () => {
    expect(typeof article.Render).toBe("function");
  });

  it("listTemplates returns objects with the contract shape", () => {
    for (const tpl of listTemplates()) {
      expect(typeof tpl.kind).toBe("string");
      expect(typeof tpl.Render).toBe("function");
      expect(tpl.kind).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("falls back gracefully — getTemplate returns undefined for unknown kinds", () => {
    expect(getTemplate("nonexistent")).toBeUndefined();
  });
});
