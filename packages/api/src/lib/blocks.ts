export type TextBlock = { type: "text"; content: string };
export type HeroBlock = { type: "hero"; heading: string; subheading?: string; ctaText?: string; ctaUrl?: string; backgroundImageUrl?: string };
export type ImageBlock = { type: "image"; url: string; alt?: string; caption?: string; fullWidth?: boolean };
export type ColumnsBlock = { type: "columns"; columns: { content: string }[] };
export type CtaBlock = { type: "cta"; heading: string; body?: string; buttonText: string; buttonUrl: string };

export type PageBlock = TextBlock | HeroBlock | ImageBlock | ColumnsBlock | CtaBlock;

export function parseBlocks(raw: string | null | undefined): PageBlock[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PageBlock[]) : null;
  } catch {
    return null;
  }
}

// Produces a plain-text/HTML content fallback used by search and RSS.
// Uses the first text block, or falls back to stripping the hero heading.
export function serializeBlocksToContent(blocks: PageBlock[]): string {
  for (const block of blocks) {
    if (block.type === "text" && block.content) return block.content;
  }
  for (const block of blocks) {
    if (block.type === "hero" && block.heading) return `<h1>${block.heading}</h1>`;
    if (block.type === "columns") {
      const combined = block.columns.map((c) => c.content).filter(Boolean).join("\n");
      if (combined) return combined;
    }
  }
  return "";
}
