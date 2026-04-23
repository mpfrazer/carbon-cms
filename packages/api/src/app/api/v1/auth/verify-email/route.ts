import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return badRequest("Missing token");

    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
    if (!user) return badRequest("Invalid or expired token");

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return badRequest("Verification link has expired");
    }

    await db.update(users).set({
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    return ok({ verified: true });
  } catch (e) {
    return serverError(e);
  }
}
