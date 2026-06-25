FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/admin/package.json ./packages/admin/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci
COPY packages/api ./packages/api
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy value so the module-level DATABASE_URL guard passes at build time.
# The real value is supplied at container runtime via the environment.
ENV DATABASE_URL=postgresql://build:build@localhost/placeholder
RUN npm run build -w packages/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/api/.next/standalone ./
# Next.js standalone in an npm-workspaces monorepo preserves the workspace
# layout, so server.js lives at /app/packages/api/server.js and its sibling
# .next/static is served from there too. Copy assets into that path, not /app.
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/.next/static ./packages/api/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/src/themes ./packages/api/src/themes

# Migration tooling — schema source + drizzle config + a fresh drizzle-kit
# install in /opt/migrate. Lets operators apply schema from outside the
# image with:
#   docker compose run --rm api node packages/api/scripts/migrate.mjs
#
# Installed in /opt/migrate (NOT /app/packages/api) because the api
# package.json declares `esbuild: ^0.28.0` as a runtime dep, while
# drizzle-kit pulls @esbuild-kit/core-utils which strictly wants
# `esbuild: ^0.18.20`. Sharing a directory triggers a post-install
# version validation conflict (Error: Expected "0.18.20" but got
# "0.28.0"). Isolating the install sidesteps the resolution.
#
# drizzle-orm is installed alongside drizzle-kit so the latter can
# resolve schema imports from its own node_modules tree rather than
# walking up to the standalone's hoisted copy (where peer-dep
# resolution can be unpredictable).
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/drizzle.config.ts ./packages/api/drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/src/lib/db ./packages/api/src/lib/db
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/scripts ./packages/api/scripts
RUN mkdir -p /opt/migrate \
    && cd /opt/migrate \
    && npm init -y >/dev/null \
    && npm install --omit=optional --no-save drizzle-kit drizzle-orm postgres \
    && chown -R nextjs:nodejs /opt/migrate

USER nextjs
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
# Built-in theme directory lives inside the package; pin explicitly so the
# default `process.cwd()`-based resolution doesn't have to assume layout.
ENV THEMES_DIR=/app/packages/api/src/themes
EXPOSE 3001

CMD ["node", "packages/api/server.js"]
