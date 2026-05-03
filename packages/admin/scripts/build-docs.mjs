/**
 * Converts docs/*.md files to HTML and writes them to src/generated/docs/.
 * Run automatically via the prebuild / predev npm hooks.
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, extname, basename, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOCS_DIR = join(__dirname, "..", "..", "..", "docs");
const OUT_DIR = join(__dirname, "..", "src", "generated", "docs");

function toTitleCase(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Parses optional YAML-lite frontmatter (---\nkey: value\n---).
// Returns { data, content } where content is the markdown with frontmatter stripped.
function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---")) return { data: {}, content: markdown };
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return { data: {}, content: markdown };
  const fm = markdown.slice(3, end).trim();
  const data = {};
  for (const line of fm.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    data[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { data, content: markdown.slice(end + 4).trimStart() };
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

async function walkDir(dir) {
  let results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await walkDir(fullPath));
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const allFiles = await walkDir(DOCS_DIR);
  if (allFiles.length === 0) {
    console.log("build-docs: no .md files found in docs/");
    await writeFile(join(OUT_DIR, "index.json"), JSON.stringify({ sections: [] }, null, 2), "utf-8");
    return;
  }

  const sectionsMap = new Map();

  for (const filePath of allFiles) {
    const rel = relative(DOCS_DIR, filePath).replace(/\\/g, "/");
    const parts = rel.split("/");

    let sectionSlug, docSlug, docPath;

    if (parts.length === 1) {
      sectionSlug = "_root";
      docSlug = basename(parts[0], ".md");
      docPath = docSlug;
    } else {
      sectionSlug = parts[0];
      docSlug = basename(parts[parts.length - 1], ".md");
      docPath = parts
        .map((p, i) => (i === parts.length - 1 ? basename(p, ".md") : p))
        .join("/");
    }

    const raw = await readFile(filePath, "utf-8");
    const { data: frontmatter, content: markdown } = parseFrontmatter(raw);
    if (frontmatter.draft === "true") continue;
    const title = extractTitle(markdown) ?? toTitleCase(docSlug);
    const html = await marked.parse(markdown, { gfm: true });

    const outPath = join(OUT_DIR, `${docPath}.json`);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(
      outPath,
      JSON.stringify({ title, path: docPath, html }, null, 2),
      "utf-8"
    );

    if (!sectionsMap.has(sectionSlug)) {
      sectionsMap.set(sectionSlug, {
        title: sectionSlug === "_root" ? "General" : toTitleCase(sectionSlug),
        slug: sectionSlug,
        docs: [],
      });
    }
    sectionsMap.get(sectionSlug).docs.push({ title, slug: docSlug, path: docPath });
  }

  const sections = Array.from(sectionsMap.values()).sort((a, b) => {
    if (a.slug === "_root") return 1;
    if (b.slug === "_root") return -1;
    return a.slug.localeCompare(b.slug);
  });

  await writeFile(
    join(OUT_DIR, "index.json"),
    JSON.stringify({ sections }, null, 2),
    "utf-8"
  );

  console.log(`build-docs: compiled ${allFiles.length} file(s) → src/generated/docs/`);
}

main().catch((err) => {
  console.error("build-docs failed:", err.message);
  process.exit(1);
});
