import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, settings } from "@/lib/db/schema";
import { ok, created, badRequest, conflict, serverError } from "@/lib/api/response";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { email, name, password } = parsed.data;

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return conflict("Email is already in use");

    const [verifySetting] = await db.select().from(settings).where(eq(settings.key, "requireEmailVerification")).limit(1);
    let requireVerification = false;
    try { requireVerification = verifySetting ? JSON.parse(verifySetting.value) === true : false; } catch { /* */ }

    const passwordHash = await bcrypt.hash(password, 12);

    let emailVerificationToken: string | null = null;
    let emailVerificationExpiry: Date | null = null;
    if (requireVerification) {
      emailVerificationToken = crypto.randomUUID();
      emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const [user] = await db.insert(users).values({
      email, name, passwordHash,
      role: "subscriber",
      emailVerified: requireVerification ? null : new Date(),
      emailVerificationToken,
      emailVerificationExpiry,
    }).returning({ id: users.id, email: users.email, name: users.name });

    if (requireVerification && emailVerificationToken) {
      sendVerificationEmail(email, name, emailVerificationToken).catch(console.error);
    } else {
      sendWelcomeEmail(email, name).catch(console.error);
    }

    return created({ ...user, requiresEmailVerification: requireVerification });
  } catch (e) {
    return serverError(e);
  }
}
