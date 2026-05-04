import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, pages, posts } from "@/lib/db/schema";
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

const SAMPLE_POST_CONTENT = `<p>Welcome to Carbon. This is a sample post — you can edit or delete it any time from your admin dashboard.</p>

<h2>Your admin dashboard</h2>
<p>Everything in Carbon is managed from the admin panel. From there you can create posts and pages, manage your media library, configure your theme, and control who has access to your site.</p>

<h2>Creating and publishing content</h2>
<p>Posts live at <strong>/blog</strong>. Create a new one from the Posts section in the sidebar, write using the rich-text editor, and set the status to <strong>Published</strong> when you're ready to go live.</p>
<p>Pages — like the home page you already have — are managed separately under Pages. They support the same editor and a drag-and-drop block builder for more structured layouts like feature grids, hero sections, and call-to-action blocks.</p>

<h2>Themes and appearance</h2>
<p>Carbon ships with two built-in themes: Default and Minimal. Switch between them instantly from Themes → Activate. Under the Appearance tab you can set your accent colour, pick fonts, upload a logo, and customise the footer — all without touching any code.</p>

<h2>Media</h2>
<p>Upload images and files from the Media section. Your library is available in every post, page, and block editor — click the image icon in the toolbar to insert directly from it.</p>

<h2>What's next</h2>
<p>Edit this post, create a new one, or open the home page and customise its block layout. Everything you need is in the admin sidebar.</p>`;

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

    const now = new Date();
    await db.insert(posts).values({
      title: "Getting Started with Carbon",
      slug: "getting-started",
      content: SAMPLE_POST_CONTENT,
      excerpt: "A quick tour of your new Carbon CMS — the admin dashboard, creating posts and pages, themes, and media.",
      status: "published",
      authorId: user.id,
      publishedAt: now,
      metaTitle: null,
      metaDescription: null,
    }).onConflictDoNothing();

    return created(user);
  } catch (e) {
    return serverError(e);
  }
}
