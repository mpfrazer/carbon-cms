import { z } from "zod";
import type { ApiTemplate } from "./registry";

export const recipeSchema = z.object({
  /**
   * Where the recipe panel (ingredients + instructions) sits relative to the
   * post body. "top" is conventional for utility-first recipe sites; "bottom"
   * matches the food-blog convention of leading with a story.
   */
  panelPlacement: z.enum(["top", "bottom"]).default("top"),

  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  servings: z.number().int().positive(),

  /** Free-form strings — "2 cups all-purpose flour", "1 tsp salt", etc. */
  ingredients: z.array(z.string().min(1)).min(1),

  instructions: z
    .array(
      z.object({
        step: z.string().min(1),
        imageUrl: z.string().url().optional(),
      }),
    )
    .min(1),

  // Optional metadata — feeds richer JSON-LD when present.
  cuisine: z.string().optional(),
  course: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  sourceUrl: z.string().url().optional(),
}).strict();

export const recipe: ApiTemplate = {
  kind: "recipe",
  label: "Recipe",
  description: "Cooking recipe with ingredients, instructions, times, and JSON-LD for Google rich results.",
  schema: recipeSchema,
};
