# Carbon CMS — Morning Setup Guide

Everything is scaffolded. You need a database and three env vars to be up and running.

## Step 1 — Create a Neon database

1. Go to [neon.tech](https://neon.tech) and sign up / sign in
2. Create a new project — name it `carbon-cms`
3. On the project dashboard, copy the **Connection string** (looks like `postgresql://...`)

## Step 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
DATABASE_URL="<paste your Neon connection string here>"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

To generate `AUTH_SECRET` quickly:
```bash
openssl rand -base64 32
```

## Step 3 — Apply the database schema

Carbon uses [Drizzle ORM](https://orm.drizzle.team/) with a **schema-first push workflow** — there are no committed migration files; the schema in `packages/api/src/lib/db/schema.ts` is the source of truth and `drizzle-kit push` applies it directly.

```bash
npm run db:push -w packages/api
```

This creates (or updates) all tables in your database.

> If you see an error about `DATABASE_URL`, double-check your `.env` file.
>
> If `drizzle-kit` prompts you about destructive changes, review carefully before confirming — `push` is designed for greenfield databases and dev iteration, not production schema migrations on populated data.

## Step 4 — Create your first admin user

**Recommended:** start the dev server (Step 5 below) and open `/admin/setup` in your browser. The web-based first-run flow walks you through admin creation interactively.

**Scripted alternative** — for headless installs or repeatable provisioning:

```bash
ADMIN_EMAIL=you@example.com \
ADMIN_NAME="Your Name" \
ADMIN_PASSWORD=at-least-eight-chars \
  node scripts/seed-admin.mjs
```

All three env vars are required (no fallback defaults — the script refuses to seed weak/known credentials). It also seeds a default Home page attributed to the admin. Safe to re-run: existing users are not modified.

### Manual alternative: Use Drizzle Studio to insert a user

```bash
npm run db:studio
```

Open the studio URL, go to the `users` table, and insert a row:
- `email`: your email
- `name`: your name
- `password_hash`: use a bcrypt hash (cost 12) of your password
- `role`: `admin`

To generate a bcrypt hash quickly:
```bash
node -e "const b=require('bcryptjs');b.hash('your-password',12).then(h=>console.log(h))"
```

## Step 5 — Start the dev server

```bash
npm run dev
```

This runs all three workspace packages concurrently:

| Service | URL |
|---|---|
| API | http://localhost:3001 |
| Admin | http://localhost:3002 |
| Frontend | http://localhost:3003 |

Open [http://localhost:3002/admin/setup](http://localhost:3002/admin/setup) for the first-run admin creation flow (or `/admin/login` if you already seeded an admin via Step 4).

---

## Docker installs

Carbon ships two compose files:

| File | For |
|---|---|
| `docker-compose.yml` | Production: Caddy in front, Let's Encrypt TLS, requires a real domain and `.env` with `AUTH_SECRET` / `POSTGRES_PASSWORD` set |
| `docker-compose.dev.yml` | Local / theme development: no Caddy, no TLS, ports published on `localhost:3001`/`3002`/`3003`, all credentials are hardcoded dev-only placeholders |

### Local dev (no domain, no TLS)

```bash
docker compose -f docker-compose.dev.yml up -d db
docker compose -f docker-compose.dev.yml run --rm api node packages/api/scripts/migrate.mjs
docker compose -f docker-compose.dev.yml up -d

# then open the admin first-run flow:
open http://localhost:3002/admin/setup
```

### Production

```bash
docker compose up -d db
docker compose run --rm api node packages/api/scripts/migrate.mjs
docker compose up -d
```

The migration script reads `DATABASE_URL` from the same env Compose injects into the api service. Idempotent — safe to re-run after a code update that adds new schema fields.

---

## Switching databases later

To move from Neon to any other Postgres provider (Supabase, Railway, self-hosted, etc.):

1. Update `DATABASE_URL` in `.env`
2. Run `npm run db:push -w packages/api` against the new database
3. Done — no code changes required

The standard `postgres.js` driver is used throughout, with no Neon-specific dependencies.

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:push -w packages/api` | Apply the schema in `packages/api/src/lib/db/schema.ts` to the database (canonical command) |
| `npm run db:studio -w packages/api` | Open Drizzle Studio (visual DB browser) |
| `npm run db:generate -w packages/api` | Generate a migration file (rarely needed — Carbon does not commit migration files) |
| `npm run build` | Production build |

## API reference

All content API routes live under `/api/v1/`. Authentication is required (session cookie from `/admin/login`).

| Resource | Endpoints |
|----------|-----------|
| Posts | `GET/POST /api/v1/posts` · `GET/PUT/DELETE /api/v1/posts/[id]` |
| Pages | `GET/POST /api/v1/pages` · `GET/PUT/DELETE /api/v1/pages/[id]` |
| Users | `GET/POST /api/v1/users` · `GET/PUT/DELETE /api/v1/users/[id]` |
| Media | `GET/POST /api/v1/media` · `GET/PUT/DELETE /api/v1/media/[id]` |
| Categories | `GET/POST /api/v1/categories` · `GET/PUT/DELETE /api/v1/categories/[id]` |
| Tags | `GET/POST /api/v1/tags` · `GET/PUT/DELETE /api/v1/tags/[id]` |
| Comments | `GET/POST /api/v1/comments` · `GET/PUT/DELETE /api/v1/comments/[id]` |
| Settings | `GET /api/v1/settings` · `PUT /api/v1/settings` |
