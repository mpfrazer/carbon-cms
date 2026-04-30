import { BlockRenderer } from "@/components/block-renderer";
import type { PageBlock } from "@/lib/blocks";

interface PageContentProps {
  title: string;
  content: string;
  updatedAt: Date;
}

export function PageContent({ title, content, updatedAt }: PageContentProps) {
  return (
    <article className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
      <header className="mb-10 border-b border-neutral-200 pb-8">
        <h1
          className="text-5xl font-bold tracking-tight text-neutral-900"
          style={{ fontFamily: "var(--carbon-font-heading)" }}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          Last updated {new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </header>
      <div
        className="prose prose-neutral max-w-none prose-lg prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}

interface PageBlocksProps {
  title: string;
  blocks: PageBlock[];
}

export function PageBlocks({ title, blocks }: PageBlocksProps) {
  return (
    <article className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <BlockRenderer blocks={blocks} />
    </article>
  );
}
