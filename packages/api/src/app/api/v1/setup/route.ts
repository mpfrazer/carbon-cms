import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, pages } from "@/lib/db/schema";
import { ok, created, badRequest, serverError } from "@/lib/api/response";

async function adminExists(): Promise<boolean> {
  const [{ value }] = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
  return value > 0;
}

const HOME_BLOCKS = JSON.stringify([
  {
    type: "hero",
    heading: "Welcome to Carbon CMS",
    subheading: "A fast, open-source CMS with a block builder, custom themes, and a full REST API — without the bloat. Edit this page from your admin dashboard.",
    ctaText: "Read the Blog",
    ctaUrl: "/blog",
  },
  {
    type: "columns",
    columns: [
      {
        content: "<h3>Block Builder</h3><p>Compose pages visually using hero sections, text blocks, columns, CTAs, and image blocks. No code required.</p>",
      },
      {
        content: "<h3>API-First</h3><p>Every content type is served via a versioned REST API at <code>/api/v1</code>. Build any frontend or integrate any tool.</p>",
      },
      {
        content: "<h3>Custom Themes</h3><p>Switch themes instantly from the admin. Each theme controls its own layout, typography, and spacing — no code changes needed.</p>",
      },
    ],
  },
  {
    type: "columns",
    columns: [
      {
        content: "<h3>Media Library</h3><p>Upload and manage images and files. Browse your library directly from posts, pages, and block editors.</p>",
      },
      {
        content: "<h3>SEO Built-in</h3><p>Meta titles, descriptions, Open Graph tags, canonical URLs, a sitemap, and an RSS feed come standard on every page.</p>",
      },
    ],
  },
  {
    type: "cta",
    heading: "Ready to build something?",
    body: "Edit this page from your admin dashboard, or create your first post and start publishing.",
    buttonText: "Read the Blog",
    buttonUrl: "/blog",
  },
]);

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

    await db.insert(pages).values({
      title: "Home",
      slug: "home",
      content: "",
      status: "published",
      authorId: user.id,
      blocks: HOME_BLOCKS,
      metaTitle: null,
      metaDescription: null,
      menuOrder: 0,
    }).onConflictDoNothing();

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}
