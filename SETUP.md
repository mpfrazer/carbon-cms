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

## Step 3 — Run database migrations

```bash
npm run db:migrate
```

This creates all tables in your Neon database.

> If you see an error about `DATABASE_URL`, double-check your `.env` file.

## Step 4 — Create your first admin user

Run this one-off script to seed an admin account:

```bash
npx tsx scripts/seed-admin.ts
```

> **Note:** `scripts/seed-admin.ts` is not yet created — we'll build it next session,
> or you can seed manually via Drizzle Studio (see below).

### Alternative: Use Drizzle Studio to insert a user

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

Open [http://localhost:3000/admin](http://localhost:3000/admin) — you'll be redirected to the login page.

---

## Switching databases later

To move from Neon to any other Postgres provider (Supabase, Railway, self-hosted, etc.):

1. Update `DATABASE_URL` in `.env`
2. Run `npm run db:migrate` against the new database
3. Done — no code changes required

The standard `postgres.js` driver is used throughout, with no Neon-specific dependencies.

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:generate` | Generate new migration files after schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run db:push` | Push schema changes directly (dev only, skips migration files) |
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
