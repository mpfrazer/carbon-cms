import type { ComponentType } from "react";

/**
 * The frontend-side view of a post template. The API holds the validation
 * schema; here we hold the React rendering pieces. Kept in sync with the
 * API's ApiTemplate registry by drift checks in the API package's tests.
 */
export interface FrontendTemplate {
  /** Persistent identifier; matches API ApiTemplate.kind. */
  kind: string;
  /** Renders the entire post body area, including post.content where applicable. */
  Render: ComponentType<TemplateRenderProps>;
  /**
   * Optional JSON-LD generator. Output is injected into the page head by
   * <TemplateJsonLd>. Receives the post and parsed structured data.
   */
  jsonLd?: (post: TemplatePost, data: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Optional CSS string applied via a <style media="print"> tag when this
   * template renders. Scoped via a per-template wrapper class.
   */
  printStyles?: string;
}

/**
 * The minimal post shape templates can rely on. Themes pass the full post
 * object through; templates pull what they need.
 */
export interface TemplatePost {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: string;
  structuredData: Record<string, unknown>;
}

export interface TemplateRenderProps {
  post: TemplatePost;
  data: Record<string, unknown>;
}

const registry = new Map<string, FrontendTemplate>();

export function registerTemplate(template: FrontendTemplate): void {
  registry.set(template.kind, template);
}

export function getTemplate(kind: string): FrontendTemplate | undefined {
  return registry.get(kind);
}

export function listTemplates(): FrontendTemplate[] {
  return Array.from(registry.values());
}
