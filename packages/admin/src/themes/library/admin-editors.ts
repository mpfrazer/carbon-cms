import type { ComponentType } from "react";
import type { AdminEditorProps } from "@/templates/registry";
import { BookReviewEditor } from "./book-review-editor";

/**
 * Admin-side editor manifest for the Library theme. Keys are template kinds
 * (matching the kinds the frontend half of the theme contributes); values are
 * React components that render in the admin process when the user edits a
 * post of that kind. Same trust model as the rest of the theme — see
 * docs/architecture/post-templates.md.
 */
export const adminEditors: Record<string, ComponentType<AdminEditorProps>> = {
  "book-review": BookReviewEditor,
};
