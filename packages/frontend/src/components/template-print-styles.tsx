import { getTemplate, type TemplatePost } from "@/templates";

interface Props {
  post: TemplatePost;
}

/**
 * Emits the template's print-only CSS when the template provides any. Scoped
 * to a per-template wrapper class (e.g. .recipe-template) so the styles only
 * activate while that template is rendered. No-op for templates that don't
 * provide printStyles.
 */
export function TemplatePrintStyles({ post }: Props) {
  const template = getTemplate(post.template);
  if (!template?.printStyles) return null;
  return <style dangerouslySetInnerHTML={{ __html: template.printStyles }} />;
}
