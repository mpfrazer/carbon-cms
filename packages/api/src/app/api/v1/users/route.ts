import { NextRequest } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ok, created, badRequest, conflict, serverError, paginated, parsePagination } from "@/lib/api/response";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
  role: z.enum(["admin", "editor", "author", "subscriber"]).default("author"),
  bio: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);
    const role = searchParams.get("role") as "admin" | "editor" | "author" | "subscriber" | null;

    const where = role ? eq(users.role, role) : undefined;

    const cols = {
      id: users.id, email: users.email, name: users.name, role: users.role,
      avatarUrl: users.avatarUrl, bio: users.bio, website: users.website,
      emailVerified: users.emailVerified, suspended: users.suspended,
      createdAt: users.createdAt,
    };

    const [rows, [{ value: total }]] = await Promise.all([
      db.select(cols).from(users).where(where).orderBy(desc(users.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(users).where(where),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
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
