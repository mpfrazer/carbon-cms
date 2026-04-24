import { NextRequest, NextResponse } from "next/server";
import { desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { generateApiKey } from "@/lib/api-key";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}` &&
    req.headers.get("x-user-role") === "admin"
  );
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(isNull(apiKeys.revokedAt))
      .orderBy(desc(apiKeys.createdAt));

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const userId = req.headers.get("x-user-id");
    const { key, keyPrefix, keyHash } = generateApiKey();

    const [row] = await db
      .insert(apiKeys)
      .values({ name: parsed.data.name, keyHash, keyPrefix, createdBy: userId ?? undefined })
      .returning({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, createdAt: apiKeys.createdAt });

    return created({ ...row, key });
  } catch (e) {
    return serverError(e);
  }
}
