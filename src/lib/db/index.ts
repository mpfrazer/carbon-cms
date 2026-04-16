import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Uses the standard postgres.js driver — works with any Postgres provider.
// To switch from Neon to another provider (Supabase, Railway, self-hosted, etc.),
// just update DATABASE_URL in .env. No code changes required.

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Disable prefetch for serverless environments (Vercel, etc.)
const client = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
