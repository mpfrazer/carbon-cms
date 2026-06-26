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

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiPkg = path.resolve(here, "..");                    // /app/packages/api
// drizzle-kit lives in /opt/migrate (isolated from the api package.json's
// esbuild dep to avoid a post-install version conflict — see Dockerfile).
const drizzleBin = "/opt/migrate/node_modules/.bin/drizzle-kit";

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

// spawnSync (not spawn + 'exit' event handler) so exit-status propagation
// is straightforward: any drizzle-kit failure surfaces in result.status or
// result.error and we exit non-zero. The previous spawn+handler approach
// silently exited 0 in some cases where drizzle-kit had already mishandled
// the error itself (see M2 in docs/carbon-cms-upstream-fixes.md).
const result = spawnSync(drizzleBin, ["push", "--config", "drizzle.config.ts"], {
  cwd: apiPkg,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("[migrate] failed to spawn drizzle-kit:", result.error.message);
  process.exit(2);
}
if (result.signal) {
  console.error(`[migrate] drizzle-kit terminated by signal: ${result.signal}`);
  process.exit(1);
}

const code = result.status ?? 1;
if (code !== 0) {
  console.error(`[migrate] drizzle-kit exited with code ${code}`);
}
process.exit(code);
