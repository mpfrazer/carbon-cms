#!/usr/bin/env node
// Carbon schema-apply wrapper for Docker self-hosters.
//
// Invocation from the host (after `docker compose up -d db`):
//   docker compose run --rm api node packages/api/scripts/migrate.mjs
//
// This runs `drizzle-kit push` against the schema at
// packages/api/src/lib/db/schema.ts using packages/api/drizzle.config.ts,
// reading DATABASE_URL from the container's environment (compose injects it
// the same way it does for the runtime API service).
//
// Why a wrapper script instead of running drizzle-kit directly:
//   1. cwd matters. drizzle.config.ts uses paths relative to packages/api/,
//      so we spawn drizzle-kit from there without forcing the caller to
//      pass --workdir.
//   2. Stable invocation. The user-facing command stays the same even if
//      the underlying drizzle-kit binary path or flags change.
//
// The dev-side equivalent of this is `npm run db:push -w packages/api`.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiPkg = path.resolve(here, "..");                    // /app/packages/api
const drizzleBin = path.join(apiPkg, "node_modules", ".bin", "drizzle-kit");

if (!existsSync(drizzleBin)) {
  console.error(
    `[migrate] drizzle-kit not found at ${drizzleBin}. This script is meant to run inside the Docker image where drizzle-kit is preinstalled. For local dev, use \`npm run db:push -w packages/api\` instead.`,
  );
  process.exit(2);
}

if (!process.env.DATABASE_URL) {
  console.error("[migrate] DATABASE_URL is not set. Configure it via docker compose (.env) and rerun.");
  process.exit(2);
}

const child = spawn(drizzleBin, ["push", "--config", "drizzle.config.ts"], {
  cwd: apiPkg,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
