import { NextRequest } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { resetStorageDriver, STORAGE_SETTING_KEYS } from "@/lib/storage";

const updateSettingsSchema = z.record(z.string(), z.unknown());

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const keys = searchParams.get("keys");

    let rows;
    if (keys) {
      const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);
      rows = await db.select().from(settings).where(inArray(settings.key, keyList));
    } else {
      rows = await db.select().from(settings).where(eq(settings.autoload, true));
    }

    // Return as a flat object: { key: value }
    const result = Object.fromEntries(
      rows.map((r) => {
        try {
          return [r.key, JSON.parse(r.value)];
        } catch (e) {
          return [r.key, r.value];
        }
      })
    );

    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const now = new Date();
    const upserts = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
      updatedAt: now,
    }));

    await db
      .insert(settings)
      .values(upserts)
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: sql`excluded.value`, updatedAt: now },
      });

    const storageKeys = new Set<string>(STORAGE_SETTING_KEYS);
    if (Object.keys(parsed.data).some((k) => storageKeys.has(k))) {
      resetStorageDriver();
    }

    return ok({ updated: upserts.length });
  } catch (e) {
    return serverError(e);
  }
}
