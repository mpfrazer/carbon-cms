import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, notFound, conflict, noContent, serverError } from "@/lib/api/response";
import { auth } from "@/lib/auth";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["admin", "editor", "author"]).optional(),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
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
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string };
    const { id } = await params;

    // Users can update themselves; only admins can update others
    if (sessionUser?.id !== id && sessionUser?.role !== "admin") {
      return badRequest("Insufficient permissions");
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return notFound("User not found");

    // Only admins can change roles
    if (parsed.data.role && sessionUser?.role !== "admin") {
      return badRequest("Only admins can change roles");
    }

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const [emailConflict] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
      if (emailConflict) return conflict("Email is already in use");
    }

    const { password, ...rest } = parsed.data;
    const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role, avatarUrl: users.avatarUrl, bio: users.bio, updatedAt: users.updatedAt });

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return badRequest("Admin access required");
    }

    const { id } = await params;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!existing) return notFound("User not found");
    await db.delete(users).where(eq(users.id, id));
    return noContent();
  } catch {
    return serverError();
  }
}
