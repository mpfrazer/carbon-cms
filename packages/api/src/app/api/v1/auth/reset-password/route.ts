import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { token, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return badRequest("This reset link is invalid or has expired.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return ok({ reset: true });
  } catch (e) {
    return serverError(e);
  }
}
