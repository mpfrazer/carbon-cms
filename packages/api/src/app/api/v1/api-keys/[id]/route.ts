import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}` &&
    req.headers.get("x-user-role") === "admin"
  );
}

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const [existing] = await db.select({ id: apiKeys.id }).from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
    if (!existing) return notFound("API key not found");

    const [revoked] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .returning({ id: apiKeys.id, name: apiKeys.name, revokedAt: apiKeys.revokedAt });

    return ok(revoked);
  } catch (e) {
    return serverError(e);
  }
}
