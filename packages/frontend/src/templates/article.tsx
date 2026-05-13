import type { FrontendTemplate, TemplateRenderProps } from "./registry";

/**
 * Article — the default template. Renders post.content as pre-rendered HTML
 * inside a prose container. This is the migration target for the existing
 * inline body div in each theme's blog-post component.
 */
function ArticleRender({ post }: TemplateRenderProps) {
  return (
    <div
      className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
      dangerouslySetInnerHTML={{ __html: post.content }}
    />
  );
}

export const article: FrontendTemplate = {
  kind: "article",
  Render: ArticleRender,
};
