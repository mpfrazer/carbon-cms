import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, created, badRequest, serverError } from "@/lib/api/response";

async function adminExists(): Promise<boolean> {
  const [{ value }] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
  return value > 0;
}

// Returns whether first-run setup is still needed
export async function GET() {
  try {
    const needed = !(await adminExists());
    return ok({ needed });
  } catch (e) {
    return serverError(e);
  }
}

// Creates the first admin account — only works when no admin exists yet
export async function POST(req: NextRequest) {
  try {
    if (await adminExists()) {
      return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = z.object({
      name: z.string().min(1).max(200),
      email: z.string().email(),
      password: z.string().min(8),
    }).safeParse(body);

    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { name, email, password } = parsed.data;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return badRequest("Email is already in use");

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      name, email, passwordHash,
      role: "admin",
      emailVerified: new Date(),
    }).returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}
