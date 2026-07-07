import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, stat } from "fs/promises";
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

describe("theme-compiler — default base", () => {
  it("copies all six THEME_FILES and esbuild compiles them cleanly", async () => {
    const { copyTheme, compileTheme, THEME_FILES } = await import("../theme-compiler");
    const slug = "default-copy-test";

    await copyTheme("default", slug);

    for (const file of THEME_FILES) {
      const s = await stat(path.join(tmpCustomDir, slug, `${file}.tsx`));
      expect(s.isFile(), `${file}.tsx should exist after copyTheme`).toBe(true);
    }

    const result = await compileTheme(slug);
    // Surface esbuild errors verbatim on failure so regressions read clearly.
    expect(result.errors ?? []).toEqual([]);
    expect(result.ok).toBe(true);
  }, 30_000);
});
