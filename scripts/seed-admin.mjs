import postgres from "postgres";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";

// Read .env manually
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const sql = postgres(env.DATABASE_URL);

const passwordHash = await bcrypt.hash("changeme123", 12);

const rows = await sql`
  INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
  VALUES (gen_random_uuid(), 'mpfrazer@gmail.com', 'M Frazer', ${passwordHash}, 'admin', now(), now())
  ON CONFLICT (email) DO NOTHING
  RETURNING id, email, name, role
`;

if (rows.length > 0) {
  console.log("Admin user created:", rows[0]);
  console.log("\nLogin at: http://localhost:3000/admin/login");
  console.log("Email:    mpfrazer@gmail.com");
  console.log("Password: changeme123");
  console.log("\nChange your password after first login.");
} else {
  console.log("User mpfrazer@gmail.com already exists — no changes made.");
}

// Seed default Home page (requires an author — use first admin user found)
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
