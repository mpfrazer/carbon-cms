import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Used by the admin package's auth.js Credentials provider to validate credentials
// without requiring the admin package to have direct DB access.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid credentials");

    const { email, password } = parsed.data;
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return badRequest("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return badRequest("Invalid credentials");

    if (user.suspended) {
      return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
    }

    if (user.emailVerificationToken !== null && !user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email address before logging in." }, { status: 403 });
    }

    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    return serverError(e);
  }
}
