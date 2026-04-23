import { Header } from "@/components/admin/header";
import { ThemesManager } from "@/components/admin/themes-manager";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

const THEMES_DIR = process.env.THEMES_DIR ?? path.join(process.cwd(), "src", "themes");

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
  preview?: string;
}

export default async function ThemesPage() {
  const [entries, activeRow] = await Promise.all([
    fs.readdir(THEMES_DIR, { withFileTypes: true }).catch(() => []),
    db.select({ value: settings.value }).from(settings).where(eq(settings.key, "activeTheme")).limit(1),
  ]);

  const activeTheme = activeRow[0] ? JSON.parse(activeRow[0].value) : "default";
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const themes: Theme[] = await Promise.all(
    dirs.map(async (name) => {
      try {
        const raw = await fs.readFile(path.join(THEMES_DIR, name, "theme.json"), "utf-8");
        const meta = JSON.parse(raw);
        return { name, active: name === activeTheme, ...meta };
      } catch {
        return { name, active: name === activeTheme, version: "unknown" };
      }
    })
  );

  return (
    <div>
      <Header title="Themes" />
      <ThemesManager themes={themes} />
    </div>
  );
}
