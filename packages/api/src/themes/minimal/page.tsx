interface PageContentProps {
  title: string;
  content: string;
  updatedAt: Date;
}

export function PageContent({ title, content, updatedAt }: PageContentProps) {
  return (
    <article>
      <header>
        <h1>{title}</h1>
        <p>
          <time>Updated {new Date(updatedAt).toISOString().slice(0, 10)}</time>
        </p>
      </header>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}

// Carbon's page-builder block union. In a portable theme we can't import
// the internal PageBlock type, so accept `unknown` and narrow per block
// `type` field. Author's job: extend this switch as they build UI for
// each block kind their site uses.
interface Block {
  type: string;
  [k: string]: unknown;
}

interface PageBlocksProps {
  title: string;
  blocks: Block[];
}

export function PageBlocks({ title, blocks }: PageBlocksProps) {
  return (
    <article>
      <header>
        <h1>{title}</h1>
      </header>
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`;
        if (block.type === "text" && typeof block.html === "string") {
          return <div key={key} dangerouslySetInnerHTML={{ __html: block.html }} />;
        }
        if (block.type === "hero") {
          return (
            <section key={key}>
              {typeof block.heading === "string" && <h2>{block.heading}</h2>}
              {typeof block.subheading === "string" && <p>{block.subheading}</p>}
            </section>
          );
        }
        if (block.type === "image" && typeof block.url === "string") {
          const alt = typeof block.alt === "string" ? block.alt : "";
          return <img key={key} src={block.url} alt={alt} />;
        }
        if (block.type === "cta") {
          const href = typeof block.href === "string" ? block.href : "#";
          const label = typeof block.label === "string" ? block.label : "Learn more";
          return (
            <p key={key}>
              <a href={href}>{label}</a>
            </p>
          );
        }
        return (
          <div key={key} data-block-type={block.type}>
            {/* Unhandled block type — extend PageBlocks to render it. */}
          </div>
        );
      })}
    </article>
  );
}
