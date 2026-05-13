import { z } from "zod";
import type { ApiTemplate } from "./registry";

export const article: ApiTemplate = {
  kind: "article",
  label: "Article",
  description: "Standard blog post or article. Title, body, the basics.",
  schema: z.object({}).strict(),
};
