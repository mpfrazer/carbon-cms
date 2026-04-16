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

await sql.end();
