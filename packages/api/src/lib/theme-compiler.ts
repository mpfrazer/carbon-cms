import esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";

export const CUSTOM_THEMES_DIR = process.env.CUSTOM_THEMES_DIR ?? path.join(process.cwd(), "..", "..", "custom-themes");
export const THEME_CACHE_DIR = path.join(CUSTOM_THEMES_DIR, ".cache");

export const THEME_FILES = ["layout", "blog-index", "blog-post", "page", "search", "not-found"] as const;

export const BUILT_IN_THEMES = ["default", "minimal"] as const;
export type BuiltInTheme = typeof BUILT_IN_THEMES[number];

export function isBuiltIn(slug: string): boolean {
  return (BUILT_IN_THEMES as readonly string[]).includes(slug);
}

export interface CompileResult {
  ok: boolean;
  errors?: string[];
}

export async function compileTheme(slug: string): Promise<CompileResult> {
  const srcDir = path.join(CUSTOM_THEMES_DIR, slug);
  const outDir = path.join(THEME_CACHE_DIR, slug);

  await fs.mkdir(outDir, { recursive: true });

  const errors: string[] = [];

  await Promise.all(
    THEME_FILES.map(async (file) => {
      const entryPoint = path.join(srcDir, `${file}.tsx`);
      try {
        await esbuild.build({
          entryPoints: [entryPoint],
          bundle: true,
          platform: "node",
          format: "cjs",
          outfile: path.join(outDir, `${file}.js`),
          external: [
            "react",
            "react/jsx-runtime",
            "react-dom",
            "next",
            "next/link",
            "next/image",
            "next/navigation",
            "next/headers",
            "lucide-react",
          ],
          jsx: "automatic",
          target: "node18",
          logLevel: "silent",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${file}.tsx: ${msg}`);
      }
    })
  );

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export async function readThemeConfig(slug: string): Promise<Record<string, unknown>> {
  const dir = isBuiltIn(slug)
    ? path.join(process.env.THEMES_DIR ?? path.join(process.cwd(), "src", "themes"), slug)
    : path.join(CUSTOM_THEMES_DIR, slug);

  try {
    const raw = await fs.readFile(path.join(dir, "theme.config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function writeThemeConfig(slug: string, config: Record<string, unknown>): Promise<void> {
  if (isBuiltIn(slug)) throw new Error("Cannot modify built-in theme config via API");
  const configPath = path.join(CUSTOM_THEMES_DIR, slug, "theme.config.json");
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export async function listCustomThemes(): Promise<string[]> {
  try {
    const entries = await fs.readdir(CUSTOM_THEMES_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name !== ".cache")
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function copyTheme(baseSlug: string, newSlug: string): Promise<void> {
  const isBase = isBuiltIn(baseSlug);
  const srcDir = isBase
    ? path.join(process.env.THEMES_DIR ?? path.join(process.cwd(), "src", "themes"), baseSlug)
    : path.join(CUSTOM_THEMES_DIR, baseSlug);
  const destDir = path.join(CUSTOM_THEMES_DIR, newSlug);

  await fs.mkdir(destDir, { recursive: true });

  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((e) => e.isFile() && !e.name.startsWith("."))
      .map(async (e) => {
        // Skip the built-in theme.config.json — generate a fresh one for the new theme
        if (e.name === "theme.config.json") return;
        await fs.copyFile(path.join(srcDir, e.name), path.join(destDir, e.name));
      })
  );

  // Read base config for capabilities, write a fresh config for the new theme
  const baseConfig = await readThemeConfig(baseSlug);
  const newConfig = {
    name: newSlug,
    version: "1.0.0",
    capabilities: baseConfig.capabilities ?? {
      blog: true,
      search: { header: true, page: true },
      pageBuilder: true,
      comments: true,
    },
  };
  await fs.writeFile(path.join(destDir, "theme.config.json"), JSON.stringify(newConfig, null, 2), "utf-8");
}
