import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { auth } from "@/lib/auth";

const THEMES_DIR = process.env.THEMES_DIR ?? path.join(process.cwd(), "src", "themes");

async function readThemeMeta(themePath: string) {
  try {
    const raw = await fs.readFile(path.join(themePath, "theme.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    const activeRow = await db.select().from(settings).where(eq(settings.key, "activeTheme")).limit(1);
    const activeTheme = activeRow[0] ? JSON.parse(activeRow[0].value) : "default";

    const themes = await Promise.all(
      dirs.map(async (name) => {
        const meta = await readThemeMeta(path.join(THEMES_DIR, name));
        return { name, active: name === activeTheme, ...(meta ?? { name, version: "unknown" }) };
      })
    );

    return ok(themes);
  } catch (e) {
    return serverError(e);
  }
}

const activateSchema = z.object({ theme: z.string().min(1) });

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return badRequest("Admin access required");
    }

    const body = await req.json();
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { theme } = parsed.data;

    try {
      await fs.access(path.join(THEMES_DIR, theme));
    } catch {
      return badRequest(`Theme "${theme}" not found`);
    }

    const now = new Date();
    await db
      .insert(settings)
      .values({ key: "activeTheme", value: JSON.stringify(theme), updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value`, updatedAt: now } });

    return ok({ activated: theme });
  } catch (e) {
    return serverError(e);
  }
}
