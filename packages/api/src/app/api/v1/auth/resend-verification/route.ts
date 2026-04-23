import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, serverError } from "@/lib/api/response";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = z.object({ email: z.string().email() }).safeParse(body);
    // Always return ok to prevent email enumeration
    if (!parsed.success) return ok({ sent: true });

    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (!user || user.emailVerified || user.role !== "subscriber") return ok({ sent: true });

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.update(users).set({
      emailVerificationToken: token,
      emailVerificationExpiry: expiry,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    sendVerificationEmail(user.email, user.name, token).catch(console.error);

    return ok({ sent: true });
  } catch (e) {
    return serverError(e);
  }
}
