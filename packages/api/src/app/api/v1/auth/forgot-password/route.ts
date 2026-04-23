import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  redirectUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { email, redirectUrl } = parsed.data;

    // Always return ok — never reveal whether the email exists
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user && !user.suspended) {
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db
        .update(users)
        .set({ passwordResetToken: token, passwordResetExpiry: expiry, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      const resetUrl = `${redirectUrl}/reset-password?token=${token}`;
      sendPasswordResetEmail(user.email, user.name, resetUrl).catch((e) =>
        console.error("[forgot-password] email send failed", e)
      );
    }

    return ok({ sent: true });
  } catch (e) {
    return serverError(e);
  }
}
