import { getTemplate, type TemplatePost } from "@/templates";

interface Props {
  post: TemplatePost;
}

/**
 * Emits the template's JSON-LD into the page head when the template provides
 * a jsonLd hook. No-op for templates that don't (article, today). Site-level
 * BlogPosting JSON-LD remains in the page route — this is additive,
 * template-specific markup (Recipe, Event, etc.) layered on top.
 */
export function TemplateJsonLd({ post }: Props) {
  const template = getTemplate(post.template);
  if (!template?.jsonLd) return null;
  const json = template.jsonLd(post, post.structuredData ?? {});
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
