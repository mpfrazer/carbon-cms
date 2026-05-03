import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { Header } from "@/components/admin/header";
import { DocsViewer } from "@/components/admin/docs-viewer";

interface DocIndex {
  sections: {
    title: string;
    slug: string;
    docs: { title: string; slug: string; path: string }[];
  }[];
}

interface Doc {
  title: string;
  path: string;
  html: string;
}

async function readIndex(): Promise<DocIndex | null> {
  try {
    const raw = await readFile(
      join(process.cwd(), "src/generated/docs/index.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readDoc(docPath: string): Promise<Doc | null> {
  try {
    const raw = await readFile(
      join(process.cwd(), "src/generated/docs", `${docPath}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const docPath = slug?.join("/") ?? "";

  const index = await readIndex();

  if (!index) {
    return (
      <div>
        <Header title="Documentation" />
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Documentation has not been built yet. Run <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">npm run build-docs</code> in the admin package.
          </p>
        </div>
      </div>
    );
  }

  // Resolve which doc to show: explicit path or first doc in index
  let resolvedPath = docPath;
  if (!resolvedPath && index.sections.length > 0) {
    resolvedPath = index.sections[0].docs[0]?.path ?? "";
  }

  const doc = resolvedPath ? await readDoc(resolvedPath) : null;
  if (docPath && !doc) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header title="Documentation" />
      <DocsViewer index={index} doc={doc} activePath={resolvedPath} />
    </div>
  );
}
