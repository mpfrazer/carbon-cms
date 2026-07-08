import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdir, mkdtemp, rm, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

// Resolve packages/api/src/themes from this test file's location so the
// suite doesn't depend on the vitest cwd (root vs. packages/api).
const here = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.resolve(here, "..", "..", "themes");

let tmpCustomDir: string;

beforeAll(async () => {
  tmpCustomDir = await mkdtemp(path.join(tmpdir(), "carbon-themes-test-"));
  // CUSTOM_THEMES_DIR is baked at module load, so set it BEFORE the dynamic
  // import inside each test. THEMES_DIR is read at call time.
  process.env.THEMES_DIR = themesDir;
  process.env.CUSTOM_THEMES_DIR = tmpCustomDir;
});

afterAll(async () => {
  if (tmpCustomDir) await rm(tmpCustomDir, { recursive: true, force: true });
});

// Each portable base must (a) place all six THEME_FILES on disk when copied
// and (b) esbuild-compile with zero unresolved imports. Add slugs here as
// new bases are introduced.
const PORTABLE_BASES = ["default", "minimal"] as const;

describe.each(PORTABLE_BASES)("theme-compiler — %s base", (base) => {
  it("copies all six THEME_FILES and esbuild compiles them cleanly", async () => {
    const { copyTheme, compileTheme, THEME_FILES } = await import("../theme-compiler");
    const slug = `${base}-copy-test`;

    await copyTheme(base, slug);

    for (const file of THEME_FILES) {
      const s = await stat(path.join(tmpCustomDir, slug, `${file}.tsx`));
      expect(s.isFile(), `${file}.tsx should exist after copyTheme("${base}")`).toBe(true);
    }

    const result = await compileTheme(slug);
    // Surface esbuild errors verbatim on failure so regressions read clearly.
    expect(result.errors ?? []).toEqual([]);
    expect(result.ok).toBe(true);
  }, 30_000);
});

describe("theme-compiler — copyTheme guardrail", () => {
  it("rejects an incomplete base with an actionable error and cleans up", async () => {
    const { copyTheme } = await import("../theme-compiler");

    const baseSlug = "incomplete-base";
    const baseDir = path.join(tmpCustomDir, baseSlug);
    await mkdir(baseDir, { recursive: true });
    // Populate 4 of the 6 required files — matches the pre-fix state of the
    // old default base that shipped only layout / blog-index / blog-post / page.
    for (const f of ["layout", "blog-index", "blog-post", "page"]) {
      await writeFile(
        path.join(baseDir, `${f}.tsx`),
        `export function ${f.replace(/-/g, "_")}() { return null; }\n`,
      );
    }

    const targetSlug = "guardrail-target";
    await expect(copyTheme(baseSlug, targetSlug)).rejects.toThrow(
      /missing search\.tsx, not-found\.tsx/,
    );

    // Half-created destination must be removed so the operator can retry.
    const targetExists = await stat(path.join(tmpCustomDir, targetSlug))
      .then(() => true)
      .catch(() => false);
    expect(targetExists).toBe(false);
  });
});
