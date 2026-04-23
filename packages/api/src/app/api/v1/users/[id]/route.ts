import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, notFound, conflict, noContent, serverError } from "@/lib/api/response";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["admin", "editor", "author", "subscriber"]).optional(),
  bio: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  suspended: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, avatarUrl: users.avatarUrl, bio: users.bio, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) return notFound("User not found");
    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return notFound("User not found");

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const [emailConflict] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
      if (emailConflict) return conflict("Email is already in use");
    }

    const { password, suspended: suspendedValue, emailVerified: emailVerifiedValue, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);
    if (suspendedValue !== undefined) {
      updates.suspended = suspendedValue;
      updates.suspendedAt = suspendedValue ? new Date() : null;
    }
    if (emailVerifiedValue !== undefined) {
      updates.emailVerified = emailVerifiedValue ? new Date() : null;
      if (emailVerifiedValue) {
        updates.emailVerificationToken = null;
        updates.emailVerificationExpiry = null;
      }
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id, email: users.email, name: users.name, role: users.role,
        avatarUrl: users.avatarUrl, bio: users.bio, website: users.website,
        suspended: users.suspended, emailVerified: users.emailVerified, updatedAt: users.updatedAt,
      });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return notFound("User not found");
    await db.delete(users).where(eq(users.id, id));
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
