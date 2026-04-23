/** Helpers safe to import in both server and client components. */

export function stripHtml(html: string, maxChars = 2000): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const jsonLike = raw.match(/[\[{][\s\S]*[\]}]/);
  if (jsonLike) return jsonLike[0];
  return raw.trim();
}
