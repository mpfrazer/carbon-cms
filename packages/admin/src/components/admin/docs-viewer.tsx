"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DocEntry {
  title: string;
  slug: string;
  path: string;
}

interface DocSection {
  title: string;
  slug: string;
  docs: DocEntry[];
}

interface DocIndex {
  sections: DocSection[];
}

interface Doc {
  title: string;
  path: string;
  html: string;
}

interface DocsViewerProps {
  index: DocIndex;
  doc: Doc | null;
  activePath: string;
}

export function DocsViewer({ index, doc, activePath }: DocsViewerProps) {
  const pathname = usePathname();

  function isActive(docPath: string) {
    return pathname === `/admin/docs/${docPath}` || (activePath === docPath && pathname === "/admin/docs");
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto">
        <nav className="p-3 space-y-5">
          {index.sections.map((section) => (
            <div key={section.slug}>
              <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.docs.map((entry) => (
                  <Link
                    key={entry.path}
                    href={`/admin/docs/${entry.path}`}
                    className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isActive(entry.path)
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                  >
                    {entry.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {doc ? (
          <article
            className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-3xl px-10 py-8
              prose-headings:font-semibold
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base
              prose-a:text-neutral-900 dark:prose-a:text-neutral-100 prose-a:underline prose-a:underline-offset-2
              prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-800 prose-pre:rounded-lg
              prose-table:text-sm
              prose-th:bg-neutral-50 dark:prose-th:bg-neutral-800/50 prose-th:font-semibold"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-neutral-400">Select a document from the sidebar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
