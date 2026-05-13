import { z } from "zod";
import type { AdminTemplate } from "./registry";

export const article: AdminTemplate = {
  kind: "article",
  label: "Article",
  description: "Standard blog post or article. Title, body, the basics.",
  schema: z.object({}).strict(),
};
