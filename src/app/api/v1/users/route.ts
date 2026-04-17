import { NextRequest } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, created, badRequest, conflict, serverError, paginated, parsePagination } from "@/lib/api/response";
import { auth } from "@/lib/auth";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
  role: z.enum(["admin", "editor", "author"]).default("author"),
  bio: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return badRequest("Admin access required");
    }

    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({ id: users.id, email: users.email, name: users.name, role: users.role, avatarUrl: users.avatarUrl, bio: users.bio, createdAt: users.createdAt })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(users),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "admin") {
      return badRequest("Admin access required");
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { password, ...rest } = parsed.data;

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, rest.email)).limit(1);
    if (existing.length > 0) return conflict("Email is already in use");

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({ ...rest, passwordHash })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt });

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}
