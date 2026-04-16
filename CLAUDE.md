# Carbon CMS

## What This Is

Carbon is a lightweight, open-source CMS built as a modern alternative to WordPress and Drupal. It is API-first, self-hostable, and designed to be embedded inside a Next.js application. The goal is a batteries-included CMS that is fast, clean, and not bloated — with a built-in admin UI, a versioned REST API, and an optional template/theme engine for those who want a turnkey frontend.

The name comes from carbon — the most fundamental building block of organic life, and the material in graphite that makes every pencil and printing press possible. Everything written traces back to carbon.

This repo is the primary CMS engine. A separate repo (`personal-brand`) consumes Carbon as its CMS. Carbon should eventually be publishable as a standalone open-source project on its own merits.

## License

AGPL v3 (open source tier). The intent is a dual-licensing model:
- **Free / open source**: AGPL v3 — any SaaS deployment must open-source its modifications
- **Commercial license**: sold separately for closed/proprietary use (not yet implemented)

As the copyright holder, the author retains the right to release a commercial version.

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js (App Router) | Embedded CMS model — single deploy |
| Language | TypeScript | Strict mode preferred |
| ORM | Drizzle ORM | Lightweight, TypeScript-native, database-agnostic |
| Database | Neon (serverless Postgres) | Default target; Drizzle adapters should allow others |
| Auth | Auth.js | Covers CMS admin + future billing portal auth |
| Styling | Tailwind CSS | Admin UI |
| Hosting | Vercel (initial) | Upgrade path: Fly.io or Railway |

## Architecture

Carbon is an **embedded, API-first CMS**. It runs as part of a Next.js application with three distinct surface areas:

```
/api/v1/...       REST API — the source of truth, all content operations
/admin/...        Admin UI — built on top of the API
/(frontend)/...   Template engine — Phase 2, optional default theme
```

Any frontend — including the personal brand site — should consume Carbon exclusively through the `/api/v1` layer. The admin UI and any default theme are just first-party consumers of the same API.

### Core Content Model (Phase 1)

- **Posts** — blog entries with status (draft/published/scheduled), slug, author, taxonomy
- **Pages** — static content pages, editable without FTP
- **Users** — roles: admin, editor, author
- **Media** — uploaded files, images
- **Taxonomies** — categories and tags
- **Comments** — first-party, moderable from admin
- **Settings** — site-wide configuration

### API Design Principles

- Versioned from day one: `/api/v1/`
- RESTful, JSON responses
- Auth via Auth.js session tokens (admin) or API keys (headless consumers)
- Pagination, filtering, and sorting on all collection endpoints
- Designed to be consumed by external frontends — not tightly coupled to Next.js

## Build Phases

### Phase 1 — Foundation (current focus)
1. Database schema design (Drizzle + Neon/Postgres)
2. REST API (`/api/v1`) — full CRUD for all content types
3. Auth (Auth.js) — admin login, role-based access
4. Admin UI (`/admin`) — manage all content types, media, settings

### Phase 2 — Template Engine
- Default theme/template system
- Server-side rendered public frontend
- Theme API for customization
- The personal brand site will use this layer

## Key Design Principles

- **No bloat** — every feature must earn its place
- **API-first** — the REST API is the product; everything else is a consumer
- **Database-agnostic** — Neon/Postgres is the default, but Drizzle adapters should make other targets feasible
- **Self-hostable** — a single `docker-compose up` (eventually) should be all that's needed
- **Dual-license ready** — no dependencies that conflict with AGPL or a future commercial license

## Related Repos

- `personal-brand` — the author's personal brand and consulting site, built on top of Carbon. Acts as the primary dogfood consumer of the API and eventual template engine.

## Future Considerations

- Plugin/extension API (post-Phase 2)
- Auth for customer-facing billing portals (planned, not yet scoped)
- Multi-site support
- CLI for setup and migrations
