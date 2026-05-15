import { describe, it, expect } from "vitest";
import { recipe } from "../recipe";
import type { TemplatePost } from "../registry";

const basePost: TemplatePost = {
  id: "abc-123",
  title: "Sourdough Loaf",
  slug: "sourdough-loaf",
  content: "<p>A reliable everyday loaf.</p>",
  excerpt: "A reliable everyday loaf.",
  publishedAt: "2026-05-10T12:00:00.000Z",
  createdAt: "2026-05-09T12:00:00.000Z",
  updatedAt: "2026-05-10T12:00:00.000Z",
  template: "recipe",
  structuredData: {},
  author: { name: "Mike Frazer", avatarUrl: null },
  featuredImage: { url: "https://example.com/loaf.jpg", altText: "loaf" },
};

const validRecipe = {
  panelPlacement: "top" as const,
  prepTimeMinutes: 30,
  cookTimeMinutes: 45,
  servings: 8,
  ingredients: ["500g bread flour", "350g water", "100g starter", "10g salt"],
  instructions: [
    { step: "Mix the dough.", imageUrl: "https://example.com/step1.jpg" },
    { step: "Bulk ferment for 4 hours." },
  ],
  cuisine: "European",
  course: "Breakfast",
};

describe("recipe.jsonLd", () => {
  it("produces a schema.org Recipe with the required fields", () => {
    const out = recipe.jsonLd!(basePost, validRecipe);
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@type"]).toBe("Recipe");
    expect(out.name).toBe("Sourdough Loaf");
    expect(out.recipeIngredient).toEqual(validRecipe.ingredients);
  });

  it("encodes durations as ISO 8601", () => {
    const out = recipe.jsonLd!(basePost, validRecipe);
    expect(out.prepTime).toBe("PT30M");
    expect(out.cookTime).toBe("PT45M");
    expect(out.totalTime).toBe("PT75M");
  });

  it("renders recipeYield with singular/plural correctly", () => {
    expect((recipe.jsonLd!(basePost, validRecipe)).recipeYield).toBe("8 servings");
    expect((recipe.jsonLd!(basePost, { ...validRecipe, servings: 1 })).recipeYield).toBe("1 serving");
  });

  it("emits HowToStep entries with text and optional images", () => {
    const out = recipe.jsonLd!(basePost, validRecipe);
    expect(out.recipeInstructions).toEqual([
      { "@type": "HowToStep", text: "Mix the dough.", image: "https://example.com/step1.jpg" },
      { "@type": "HowToStep", text: "Bulk ferment for 4 hours." },
    ]);
  });

  it("includes the featured image plus per-step images in image[]", () => {
    const out = recipe.jsonLd!(basePost, validRecipe);
    expect(out.image).toEqual([
      "https://example.com/loaf.jpg",
      "https://example.com/step1.jpg",
    ]);
  });

  it("omits image entirely when no images are present", () => {
    const noImages = { ...basePost, featuredImage: null };
    const noStepImages = { ...validRecipe, instructions: [{ step: "Just do it." }] };
    const out = recipe.jsonLd!(noImages, noStepImages);
    expect(out.image).toBeUndefined();
  });

  it("includes optional cuisine / category when present", () => {
    const out = recipe.jsonLd!(basePost, validRecipe);
    expect(out.recipeCuisine).toBe("European");
    expect(out.recipeCategory).toBe("Breakfast");
  });

  it("omits optional fields when not provided", () => {
    const minimal = {
      panelPlacement: "top" as const,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      servings: 2,
      ingredients: ["x"],
      instructions: [{ step: "y" }],
    };
    const out = recipe.jsonLd!(basePost, minimal);
    expect(out.recipeCuisine).toBeUndefined();
    expect(out.recipeCategory).toBeUndefined();
  });

  it("includes author when provided", () => {
    const out = recipe.jsonLd!(basePost, validRecipe);
    expect(out.author).toEqual({ "@type": "Person", name: "Mike Frazer" });
  });

  it("returns an empty object for non-recipe data (defensive)", () => {
    expect(recipe.jsonLd!(basePost, { not: "a recipe" })).toEqual({});
  });
});

describe("recipe template registration", () => {
  it("provides a Render component", () => {
    expect(typeof recipe.Render).toBe("function");
  });

  it("provides print styles scoped to .recipe-template", () => {
    expect(recipe.printStyles).toBeDefined();
    expect(recipe.printStyles!).toContain(".recipe-template");
    expect(recipe.printStyles!).toContain("@media print");
  });
});
