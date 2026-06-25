// Carbon CMS — seed an initial admin user (and a default Home page).
//
// This is the CLI / scripted equivalent of the web-based /admin/setup
// first-run flow. Use whichever fits your install. The web flow is the
// documented default in SETUP.md.
//
// Usage:
//   ADMIN_EMAIL=you@example.com \
//   ADMIN_NAME="Your Name" \
//   ADMIN_PASSWORD=at-least-eight-chars \
//     node scripts/seed-admin.mjs
//
// All three env vars are required. The script reads DATABASE_URL from .env
// at the repo root (or from process.env if already set), connects to
// Postgres, and inserts the admin user. ON CONFLICT (email) DO NOTHING —
// safe to re-run; existing users are not modified.
//
// After seeding, log in at the admin URL printed at the end and change the
// password if you want a different value than the one you supplied here.

import postgres from "postgres";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";

// --- Read DATABASE_URL ---
// Prefer process.env (set by the shell, by docker compose, etc.); fall back
// to .env at the repo root for the dev workflow that SETUP.md documents.
function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env")) {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
      if (!env[key]) env[key] = value;
    }
  }
  return env;
}

const env = loadEnv();

// --- Validate inputs ---
const errors = [];
if (!env.DATABASE_URL) errors.push("DATABASE_URL is not set (check your .env)");
const adminEmail = env.ADMIN_EMAIL;
const adminName = env.ADMIN_NAME;
const adminPassword = env.ADMIN_PASSWORD;
if (!adminEmail) errors.push("ADMIN_EMAIL is not set");
if (!adminName) errors.push("ADMIN_NAME is not set");
if (!adminPassword) errors.push("ADMIN_PASSWORD is not set");
if (adminPassword && adminPassword.length < 8) {
  errors.push("ADMIN_PASSWORD must be at least 8 characters");
}
if (adminEmail && !adminEmail.includes("@")) {
  errors.push("ADMIN_EMAIL doesn't look like an email address");
}

if (errors.length > 0) {
  console.error("seed-admin: cannot continue:");
  for (const e of errors) console.error("  • " + e);
  console.error("\nExample:");
  console.error('  ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD=secret123 node scripts/seed-admin.mjs');
  console.error("\nOr use the web first-run flow at /admin/setup instead.");
  process.exit(1);
}

// --- Seed the admin user ---
const sql = postgres(env.DATABASE_URL);
const passwordHash = await bcrypt.hash(adminPassword, 12);

const rows = await sql`
  INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
  VALUES (gen_random_uuid(), ${adminEmail}, ${adminName}, ${passwordHash}, 'admin', now(), now())
  ON CONFLICT (email) DO NOTHING
  RETURNING id, email, name, role
`;

const adminUrl = env.CARBON_ADMIN_URL ?? "http://localhost:3002";

if (rows.length > 0) {
  console.log("Admin user created:", rows[0]);
  console.log(`\nLog in at: ${adminUrl}/admin/login`);
  console.log(`Email:     ${adminEmail}`);
} else {
  console.log(`User ${adminEmail} already exists — no changes made.`);
}

// --- Seed a default Home page (only if there's an admin to attribute it to) ---
const [author] = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;

if (author) {
  const homeContent = `<h1>Welcome</h1><p>This site is running on <strong>Carbon CMS</strong> — a lightweight, open-source content management system built on Next.js.</p><h2>Getting started</h2><p>You can manage your site from the <a href="/admin">admin interface</a>:</p><ul><li><p><strong>Pages</strong> — add, edit, and delete content pages like this one</p></li><li><p><strong>Posts</strong> — write and publish blog posts with categories and tags</p></li><li><p><strong>Media</strong> — upload and manage images and files</p></li><li><p><strong>Users</strong> — invite collaborators and manage roles</p></li><li><p><strong>Settings</strong> — configure your site name, description, and more</p></li></ul><h2>About Carbon CMS</h2><p>Carbon is API-first and self-hostable. All content is served through a versioned REST API at <code>/api/v1</code>, making it easy to build any kind of frontend on top of it.</p>`;

  const pageRows = await sql`
    INSERT INTO pages (id, title, slug, content, status, author_id, menu_order, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Home', 'home', ${homeContent}, 'published', ${author.id}, 0, now(), now())
    ON CONFLICT (slug) DO NOTHING
    RETURNING id, title, slug, status
  `;

  if (pageRows.length > 0) {
    console.log("\nHome page created:", pageRows[0]);
  } else {
    console.log("\nHome page already exists — no changes made.");
  }
}

await sql.end();
