import { getTemplate, type TemplatePost } from "@/templates";

interface Props {
  post: TemplatePost;
}

/**
 * Single dispatcher for the post body area. Looks up the template by
 * post.template, falls back to "article" if the kind is unknown (the
 * theme-switch fallback contract documented in
 * docs/architecture/post-templates.md).
 */
export function TemplateRenderer({ post }: Props) {
  const template = getTemplate(post.template) ?? getTemplate("article");
  if (!template) {
    // Defensive: article must always be registered. If we get here, the
    // registry is misconfigured; render the raw content so the page is
    // not entirely broken.
    return (
      <div
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    );
  }
  const { Render } = template;
  return <Render post={post} data={post.structuredData ?? {}} />;
}
