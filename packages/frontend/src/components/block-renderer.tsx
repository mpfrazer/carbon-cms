import Image from "next/image";
import Link from "next/link";
import type { PageBlock } from "@/lib/blocks";

function TextBlock({ content }: { content: string }) {
  return (
    <div
      className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function HeroBlock({ heading, subheading, ctaText, ctaUrl, backgroundImageUrl }: {
  heading: string; subheading?: string; ctaText?: string; ctaUrl?: string; backgroundImageUrl?: string;
}) {
  return (
    <div className={`relative rounded-xl overflow-hidden py-20 px-8 text-center mb-8 ${backgroundImageUrl ? "" : "bg-neutral-900"}`}>
      {backgroundImageUrl && (
        <Image src={backgroundImageUrl} alt="" fill className="object-cover" />
      )}
      <div className={`relative z-10 ${backgroundImageUrl ? "text-white" : "text-white"}`}>
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--carbon-font-heading)" }}
        >
          {heading}
        </h1>
        {subheading && (
          <p className="mt-4 text-lg opacity-80 max-w-xl mx-auto">{subheading}</p>
        )}
        {ctaText && ctaUrl && (
          <Link
            href={ctaUrl}
            className="mt-8 inline-block rounded-md px-6 py-3 text-sm font-semibold text-neutral-900 bg-white hover:opacity-90 transition-opacity"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}

function ImageBlock({ url, alt, caption, fullWidth }: {
  url: string; alt?: string; caption?: string; fullWidth?: boolean;
}) {
  return (
    <figure className={`my-8 ${fullWidth ? "-mx-4 sm:-mx-6" : ""}`}>
      <div className="relative w-full overflow-hidden rounded-lg">
        <Image
          src={url}
          alt={alt ?? ""}
          width={1200}
          height={600}
          className="w-full object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-neutral-500">{caption}</figcaption>
      )}
    </figure>
  );
}

function ColumnsBlock({ columns }: { columns: { content: string }[] }) {
  const gridClass = columns.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={`grid ${gridClass} gap-8 my-8`}>
      {columns.map((col, i) => (
        <div
          key={i}
          className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline"
          dangerouslySetInnerHTML={{ __html: col.content }}
        />
      ))}
    </div>
  );
}

function CtaBlock({ heading, body, buttonText, buttonUrl }: {
  heading: string; body?: string; buttonText: string; buttonUrl: string;
}) {
  return (
    <div className="my-8 rounded-xl border border-neutral-200 bg-neutral-50 px-8 py-10 text-center">
      <h2 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: "var(--carbon-font-heading)" }}>
        {heading}
      </h2>
      {body && <p className="mt-3 text-neutral-600 max-w-md mx-auto">{body}</p>}
      <Link
        href={buttonUrl}
        className="mt-6 inline-block rounded-md px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--carbon-accent)" }}
      >
        {buttonText}
      </Link>
    </div>
  );
}

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text": return <TextBlock key={i} {...block} />;
          case "hero": return <HeroBlock key={i} {...block} />;
          case "image": return <ImageBlock key={i} {...block} />;
          case "columns": return <ColumnsBlock key={i} {...block} />;
          case "cta": return <CtaBlock key={i} {...block} />;
          default: return null;
        }
      })}
    </div>
  );
}
