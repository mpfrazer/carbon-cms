import Link from "next/link";

interface PageContentProps {
  title: string;
  content: string;
  updatedAt: Date;
}

export function PageContent({ title, content, updatedAt }: PageContentProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Last updated {new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </header>
      <div
        className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}

// Carbon's page-builder blocks. Types are inlined so the portable base
// doesn't import from Carbon internals (unreachable in the compile sandbox).
// Fields mirror packages/frontend/src/lib/blocks.ts; extend the switch below
// as new block kinds are added upstream.
type TextBlock = { type: "text"; content: string };
type HeroBlock = { type: "hero"; heading: string; subheading?: string; ctaText?: string; ctaUrl?: string; backgroundImageUrl?: string };
type ImageBlock = { type: "image"; url: string; alt?: string; caption?: string; fullWidth?: boolean };
type ColumnsBlock = { type: "columns"; columns: { content: string }[] };
type CtaBlock = { type: "cta"; heading: string; body?: string; buttonText: string; buttonUrl: string };
type PageBlock = TextBlock | HeroBlock | ImageBlock | ColumnsBlock | CtaBlock;

interface PageBlocksProps {
  title: string;
  blocks: PageBlock[];
}

function renderBlock(block: PageBlock, key: number) {
  switch (block.type) {
    case "text":
      return (
        <div
          key={key}
          className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case "hero":
      return (
        <div
          key={key}
          className="relative rounded-xl overflow-hidden py-20 px-8 text-center mb-8 bg-neutral-900"
          style={block.backgroundImageUrl ? {
            backgroundImage: `url(${JSON.stringify(block.backgroundImageUrl)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : undefined}
        >
          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{block.heading}</h1>
            {block.subheading && (
              <p className="mt-4 text-lg opacity-80 max-w-xl mx-auto">{block.subheading}</p>
            )}
            {block.ctaText && block.ctaUrl && (
              <Link
                href={block.ctaUrl}
                className="mt-8 inline-block rounded-md px-6 py-3 text-sm font-semibold text-neutral-900 bg-white hover:opacity-90 transition-opacity"
              >
                {block.ctaText}
              </Link>
            )}
          </div>
        </div>
      );
    case "image":
      return (
        <figure key={key} className={`my-8 ${block.fullWidth ? "-mx-4 sm:-mx-6" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt ?? ""} className="w-full rounded-lg object-cover" />
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-neutral-500">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "columns": {
      const gridClass = block.columns.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";
      return (
        <div key={key} className={`grid ${gridClass} gap-8 my-8`}>
          {block.columns.map((col, i) => (
            <div
              key={i}
              className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline"
              dangerouslySetInnerHTML={{ __html: col.content }}
            />
          ))}
        </div>
      );
    }
    case "cta":
      return (
        <div
          key={key}
          className="my-8 rounded-xl border border-neutral-200 bg-neutral-50 px-8 py-10 text-center"
        >
          <h2 className="text-2xl font-bold text-neutral-900">{block.heading}</h2>
          {block.body && <p className="mt-3 text-neutral-600 max-w-md mx-auto">{block.body}</p>}
          <Link
            href={block.buttonUrl}
            className="mt-6 inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
          >
            {block.buttonText}
          </Link>
        </div>
      );
  }
}

export function PageBlocks({ title, blocks }: PageBlocksProps) {
  return (
    <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="sr-only">{title}</h1>
      {blocks.map((block, i) => renderBlock(block, i))}
    </article>
  );
}
