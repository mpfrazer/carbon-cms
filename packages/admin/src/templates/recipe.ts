import { z } from "zod";
import type { AdminTemplate } from "./registry";
import { RecipeEditor } from "@/components/admin/recipe-editor";

// Mirror of packages/api/src/lib/templates/recipe.ts. Drift between the API
// and admin schemas would surface as form-saves that pass client-side
// validation but fail at the API. The cross-package drift test in the API
// package's templates test asserts the kind set matches; the schema
// duplication itself is intentional (each package owns its own Zod tree
// because they don't share runtime).
export const recipeSchema = z.object({
  panelPlacement: z.enum(["top", "bottom"]).default("top"),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z
    .array(
      z.object({
        step: z.string().min(1),
        imageUrl: z.string().url().optional(),
      }),
    )
    .min(1),
  cuisine: z.string().optional(),
  course: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  sourceUrl: z.string().url().optional(),
}).strict();

export const recipe: AdminTemplate = {
  kind: "recipe",
  label: "Recipe",
  description: "Cooking recipe with ingredients, instructions, times, and JSON-LD for Google rich results.",
  schema: recipeSchema,
  AdminEditor: RecipeEditor,
};
