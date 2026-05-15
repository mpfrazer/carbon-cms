import { describe, it, expect } from "vitest";
import {
  article,
  recipe,
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
const BUILTIN_TEMPLATE_KINDS_EXPECTED_EVERYWHERE = ["article", "recipe"];

describe("built-in template kinds are stable across packages", () => {
  it("API registry exposes exactly the documented built-in kinds", () => {
    const apiKinds = listTemplateKinds().sort();
    expect(apiKinds).toEqual(BUILTIN_TEMPLATE_KINDS_EXPECTED_EVERYWHERE.slice().sort());
  });
});

describe("recipe template", () => {
  const validRecipe = {
    panelPlacement: "top" as const,
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    servings: 4,
    ingredients: ["2 cups flour", "1 tsp salt"],
    instructions: [{ step: "Mix dry ingredients." }, { step: "Bake for 45 minutes." }],
  };

  it("accepts a complete valid recipe", () => {
    expect(recipe.schema.safeParse(validRecipe).success).toBe(true);
  });

  it("requires at least one ingredient", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, ingredients: [] }).success,
    ).toBe(false);
  });

  it("requires at least one instruction step", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, instructions: [] }).success,
    ).toBe(false);
  });

  it("rejects negative time values", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, prepTimeMinutes: -5 }).success,
    ).toBe(false);
  });

  it("rejects zero or negative servings", () => {
    expect(recipe.schema.safeParse({ ...validRecipe, servings: 0 }).success).toBe(false);
    expect(recipe.schema.safeParse({ ...validRecipe, servings: -1 }).success).toBe(false);
  });

  it("rejects ingredient strings that are empty", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, ingredients: [""] }).success,
    ).toBe(false);
  });

  it("rejects instruction steps with empty text", () => {
    expect(
      recipe.schema.safeParse({
        ...validRecipe,
        instructions: [{ step: "" }],
      }).success,
    ).toBe(false);
  });

  it("rejects malformed instruction image URLs", () => {
    expect(
      recipe.schema.safeParse({
        ...validRecipe,
        instructions: [{ step: "do thing", imageUrl: "not-a-url" }],
      }).success,
    ).toBe(false);
  });

  it("rejects unknown difficulty values", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, difficulty: "wizard" }).success,
    ).toBe(false);
  });

  it("rejects unknown panelPlacement values", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, panelPlacement: "side" }).success,
    ).toBe(false);
  });

  it("rejects extra unknown fields (strict)", () => {
    expect(
      recipe.schema.safeParse({ ...validRecipe, secretField: 42 }).success,
    ).toBe(false);
  });

  it("validateStructuredData routes through the recipe schema", () => {
    expect(validateStructuredData("recipe", validRecipe).ok).toBe(true);
    expect(validateStructuredData("recipe", { ingredients: [] }).ok).toBe(false);
  });
});
