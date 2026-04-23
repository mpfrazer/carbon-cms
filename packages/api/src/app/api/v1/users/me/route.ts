import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { NextResponse } from "next/server";

const SAFE_COLS = {
  id: users.id, email: users.email, name: users.name, role: users.role,
  avatarUrl: users.avatarUrl, bio: users.bio, website: users.website,
  emailVerified: users.emailVerified, createdAt: users.createdAt, updatedAt: users.updatedAt,
};

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  bio: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  password: z.string().min(8).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const [user] = await db.select(SAFE_COLS).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return notFound("User not found");
    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { password, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);

    const [updated] = await db.update(users).set(updates)
      .where(eq(users.id, userId))
      .returning(SAFE_COLS);

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
