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
