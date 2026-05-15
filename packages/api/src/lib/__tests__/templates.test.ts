import { describe, it, expect } from "vitest";
import {
  article,
  getTemplate,
  listTemplateKinds,
  listTemplates,
  validateStructuredData,
} from "../templates";

describe("article template", () => {
  it("is registered as the built-in default", () => {
    expect(getTemplate("article")).toBeDefined();
    expect(getTemplate("article")?.kind).toBe("article");
  });

  it("accepts an empty structuredData object", () => {
    expect(article.schema.safeParse({}).success).toBe(true);
  });

  it("rejects extra fields (strict schema, no accidental data accumulation)", () => {
    expect(article.schema.safeParse({ ingredients: ["salt"] }).success).toBe(false);
  });
});

describe("template registry", () => {
  it("has at least the article template after module init", () => {
    expect(listTemplateKinds()).toContain("article");
  });

  it("listTemplates returns objects with the registry contract shape", () => {
    for (const tpl of listTemplates()) {
      expect(typeof tpl.kind).toBe("string");
      expect(typeof tpl.label).toBe("string");
      expect(tpl.schema).toBeDefined();
      // Kind values follow the lowercase-with-hyphens convention.
      expect(tpl.kind).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("kind values are unique", () => {
    const kinds = listTemplateKinds();
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});

describe("validateStructuredData", () => {
  it("returns ok with parsed data on success", () => {
    const result = validateStructuredData("article", {});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({});
  });

  it("returns 400 for unknown templates", () => {
    const result = validateStructuredData("nonexistent", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("nonexistent");
    }
  });

  it("returns 422 for valid template with invalid data", () => {
    const result = validateStructuredData("article", { stray: "field" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
      expect(result.details).toBeDefined();
    }
  });

  it("treats null/undefined data as an empty object (sensible default)", () => {
    expect(validateStructuredData("article", null).ok).toBe(true);
    expect(validateStructuredData("article", undefined).ok).toBe(true);
  });
});

// Mirrors the built-in template kinds expected to be registered in every
// package (api / admin / frontend). Catches drift when a kind is added to
// one registry but not the others — same pattern used for webhook events
// and api-key scopes vocabulary.
const BUILTIN_TEMPLATE_KINDS_EXPECTED_EVERYWHERE = ["article"];

describe("built-in template kinds are stable across packages", () => {
  it("API registry exposes exactly the documented built-in kinds", () => {
    const apiKinds = listTemplateKinds().sort();
    expect(apiKinds).toEqual(BUILTIN_TEMPLATE_KINDS_EXPECTED_EVERYWHERE.slice().sort());
  });
});
