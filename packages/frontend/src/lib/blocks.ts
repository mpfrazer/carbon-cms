// Block type definitions — kept in sync with packages/api/src/lib/blocks.ts
export type TextBlock = { type: "text"; content: string };
export type HeroBlock = { type: "hero"; heading: string; subheading?: string; ctaText?: string; ctaUrl?: string; backgroundImageUrl?: string };
export type ImageBlock = { type: "image"; url: string; alt?: string; caption?: string; fullWidth?: boolean };
export type ColumnsBlock = { type: "columns"; columns: { content: string }[] };
export type CtaBlock = { type: "cta"; heading: string; body?: string; buttonText: string; buttonUrl: string };

export type PageBlock = TextBlock | HeroBlock | ImageBlock | ColumnsBlock | CtaBlock;
