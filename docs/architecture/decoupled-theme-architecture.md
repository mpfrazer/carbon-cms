# Decoupled Theme Architecture

## Overview

This document proposes splitting Carbon CMS into three independently deployable units, enabling WordPress-style theme hot-swapping without requiring changes to the application core. It is written for author review and approval before implementation begins.

---

## Problem Statement

In the current architecture, themes are React components compiled directly into the Next.js application bundle. Changing or swapping a theme requires:

1. Modifying source files inside the Carbon repo
2. Running `next build` on the entire application
3. Redeploying the whole app

This makes Carbon difficult to distribute as a standalone product and prevents end users from managing themes without touching application code.

---

## Proposed Architecture

Carbon is split into three independently deployable units:

```
carbon-api/
  → REST API (/api/v1/*)
  → Auth (Auth.js)
  → Database (Drizzle + Postgres)
  → No UI of any kind

carbon-admin/
  → Admin UI (/admin/*)
  → Consumes carbon-api exclusively via HTTP
  → No direct DB access

carbon-frontend/
  → Public-facing site
  → Theme layer
  → Consumes carbon-api exclusively via HTTP
  → Themes are swappable without touching carbon-api or carbon-admin
```

Each unit has its own `package.json`, its own build, and its own deployment. They communicate only through the `/api/v1/` contract.

---

## Theme System Design

### Theme Structure

Themes are directories installed inside `carbon-frontend/themes/`. Each theme contains:

```
themes/
  default/
    theme.json          ← metadata
    layout.tsx          ← site chrome: header, footer, nav
    blog-index.tsx      ← blog listing page
    blog-post.tsx       ← individual post page
    page.tsx            ← static page
    globals.css         ← theme-scoped styles
  my-custom-theme/
    theme.json
    layout.tsx
    ...
```

`theme.json` carries metadata that the Admin UI reads and displays:

```json
{
  "name": "Default",
  "version": "1.0.0",
  "author": "Carbon CMS",
  "description": "Clean, minimal default theme",
  "preview": "preview.png"
}
```

### Active Theme Resolution

The frontend reads the active theme name from the API at startup (or per-request in SSR mode) and dynamically resolves theme components. A single `ThemeProvider` in `carbon-frontend` handles this:

```
carbon-frontend/
  app/
    (site)/
      layout.tsx        ← imports from ThemeProvider, not hardcoded theme
      page.tsx
      blog/page.tsx
      [slug]/page.tsx
  lib/
    theme-provider.ts   ← resolves ACTIVE_THEME → component imports
  themes/
    default/
    ...
```

### Theme Distribution

Themes are distributed as `.zip` archives. The Admin UI exposes a Themes section where users can:

- Browse installed themes
- Upload a `.zip` to install a new theme
- Activate a theme
- Delete an installed theme

The API handles unzipping and writing theme files to `carbon-frontend/themes/`. On activation, the API updates the `active_theme` setting in the database and fires a build webhook.

---

## Hot-Swap Mechanism

The "hot-swap" is a triggered rebuild of `carbon-frontend`. This is the analog of WordPress's instantaneous theme activation — the build replaces the runtime step.

### Flow

```
Admin activates theme
        ↓
carbon-admin  →  POST /api/v1/settings  (active_theme = "new-theme")
        ↓
carbon-api saves setting, then
        →  POST carbon-frontend/api/internal/rebuild  (signed with shared secret)
        ↓
carbon-frontend build service:
  1. runs `next build`
  2. on success, restarts the server process
  3. returns build status to API
        ↓
Admin polls  GET /api/v1/settings/build-status  until complete
Admin shows success/failure to user
```

### Webhook Security

The internal rebuild endpoint is not public. It is protected by a shared secret (`REBUILD_SECRET` env var) set at deploy time. The API signs the webhook request; the frontend verifies it before running a build.

### Build Time

Expect 15–60 seconds depending on host hardware and theme complexity. The Admin UI shows a progress state during this window. The existing site continues serving the old theme until the build completes and the process restarts — zero downtime for site visitors.

---

## Render Mode: SSR vs. CSR

`carbon-frontend` supports two render modes, toggled from the Admin UI under **Settings → Performance → Render Mode**. The setting is stored in the database and takes effect on the next frontend restart or rebuild.

### SSR (Server-Side Rendering)

Pages are rendered on the server on every request. The active theme is read from the API per-request using a short-lived in-memory cache (5s TTL).

- Theme swap is live within seconds — no build, no restart required
- Every page request hits the server; no static HTML is cached at the edge
- Higher server resource usage under load
- Best for: self-hosted deployments, low-to-medium traffic, or any site where theme agility matters more than raw performance

### CSR (Client-Side Rendering)

Pages are pre-built as static HTML at deploy time and served from a CDN or edge cache. Theme changes trigger a full rebuild (15–60 seconds) before going live.

- Fastest possible page delivery — static HTML served from cache, no server round-trip
- Theme swap requires a build cycle before changes are visible
- Lowest server resource usage; scales easily under high traffic
- Best for: high-traffic sites, edge-deployed frontends, or any site where performance is the priority

### Admin UI — Settings Detail

The Render Mode setting appears in the Admin Settings panel with the following inline explanation shown to the user:

> **Render Mode**
>
> Controls how your public site renders pages to visitors.
>
> **Server-Side Rendering (SSR)** — Pages are built on the server each time a visitor loads them. Theme changes go live immediately without a rebuild. Uses more server resources and pages are not cached at the edge.
>
> **Client-Side Rendering (CSR)** — Pages are pre-built and served as static files from a CDN. Faster page loads and lower server load, but theme changes require a rebuild (typically 15–60 seconds) before they appear.
>
> If you are unsure, start with SSR. You can switch to CSR later when you are ready to optimise for performance.

The toggle is a radio or select input. Changing the mode:
1. Writes `render_mode` (`ssr` | `csr`) to the settings table via the API
2. If switching to CSR, immediately queues a rebuild so the static output reflects the current theme
3. If switching to SSR, restarts the frontend process in SSR mode — no build required

The current mode is also surfaced as a read-only badge on the Themes page so users understand why a theme activation triggers a build (CSR) or not (SSR).

---

## Migration Plan

### Phase 1 — Extract the API

Extract all `/api/v1/` routes, database code, and Auth.js config into a standalone `carbon-api` package. The existing monorepo can house all three packages under a single repo root (`packages/api`, `packages/admin`, `packages/frontend`) using npm workspaces, making local development simpler while keeping deployments independent.

At the end of Phase 1: `carbon-api` runs standalone. Admin and frontend still live in the monorepo but import nothing from each other.

### Phase 2 — Extract the Admin UI

Move `src/app/(admin)/` and `src/components/admin/` into `packages/admin`. Replace all direct DB imports with `fetch` calls to `carbon-api`. Add the Themes management section to the Admin UI.

At the end of Phase 2: Admin UI has no DB dependency. All data flows through the API.

### Phase 3 — Extract and Refactor the Frontend

Move `src/app/(frontend)/` and `src/themes/` into `packages/frontend`. Introduce `ThemeProvider` to resolve theme components dynamically. Add the internal rebuild endpoint and build service. Wire up theme activation → build webhook from the API.

At the end of Phase 3: Full decoupled architecture in place. Themes can be uploaded, activated, and swapped from the Admin UI.

### Phase 4 — Theme Packaging

Define the theme zip format and extraction logic. Publish `@carbon-cms/theme-default` as the first standalone theme package. Document the theme API so third-party themes can be built against it.

---

## Self-Hosted Deployment

A `docker-compose.yml` at the repo root orchestrates all three services plus Postgres:

```yaml
services:
  db:
    image: postgres:16
    ...

  api:
    build: ./packages/api
    env_file: .env
    depends_on: [db]

  admin:
    build: ./packages/admin
    environment:
      CARBON_API_URL: http://api:3001
    depends_on: [api]

  frontend:
    build: ./packages/frontend
    environment:
      CARBON_API_URL: http://api:3001
      REBUILD_SECRET: ${REBUILD_SECRET}
    volumes:
      - themes:/app/themes    ← persists uploaded themes across restarts
    depends_on: [api]

volumes:
  themes:
```

The `frontend` container includes a lightweight process manager (e.g. `tini` + a shell wrapper) that can:
1. Receive the rebuild webhook
2. Run `next build` inside the container
3. Replace the running server process when the build completes

No external CI/CD is required for self-hosted deployments.

---

## Tradeoffs and Risks

| Concern | Detail |
|---|---|
| Build latency on theme swap | 15–60s vs. instant in WordPress. Mitigated by switching to SSR mode in Admin Settings, or by setting user expectation that CSR mode theme activation is a "deploy" not a "save". |
| Operational complexity | Three services instead of one. Mitigated by docker-compose for self-hosted; Vercel projects per package for cloud. |
| API as single point of failure | Admin and frontend both depend on the API being up. Same as WordPress depending on the DB — acceptable. |
| Theme API surface | Third-party themes must conform to the component interface. A breaking change in the theme API breaks all themes. Requires versioning (`theme.json` declares `apiVersion`). |
| Cold starts on rebuild | Container restarts briefly drop in-flight requests. Acceptable for self-hosted. Cloud deployments (Vercel, Fly) handle this with zero-downtime swap natively. |

---

## Out of Scope for This Plan

- Plugin/extension API (separate initiative, post-Phase 2)
- Theme marketplace or discovery UI
- Multi-site support
- Billing portal auth

---

## Decision Required

Approve this plan to proceed with Phase 1. Each phase will be planned and reviewed independently before implementation.
