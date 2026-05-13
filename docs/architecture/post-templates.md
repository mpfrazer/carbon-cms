---
draft: true
---

# Post Templates

## Overview

This document proposes adding **post templates** (structured content types) to Carbon. A post template attaches a typed schema of additional fields to a post — `recipe` posts gain `ingredients`, `prepTimeMinutes`, `cookTimeMinutes`, `servings`, `instructions`; `event` posts gain `startsAt`, `venue`, `ticketUrl`; etc. Themes render those fields with dedicated components, and the API emits matching JSON-LD for SEO rich snippets.

This is the substrate that lets Carbon serve site categories beyond "blog" and "marketing pages" — recipe sites, event listings, product reviews, real-estate listings, podcast indexes, anything with consistently-structured content. It is written for author review and approval before implementation begins.

---

## Problem Statement

Today every Carbon post has the same shape: title, slug, content, excerpt, status, taxonomy, dates. There is no way to express that *this kind of post* always has *these specific fields* and *renders this way*. Workarounds:

- Cram structured data into Markdown using ad-hoc conventions — fragile, unsearchable, can't drive JSON-LD
- Define new top-level content types alongside posts (a `recipes` table) — multiplies authoring/scheduling/taxonomy/comments/search/RSS surface area for every new category
- Use widgets to display structured panels — wrong tool; widgets are chrome around content, not content itself

What's missing is a way to extend a post's schema without forking its lifecycle.

---

## Goals & Non-Goals

### Goals

- Posts can declare a `template` ("kind") that defines additional structured fields
- Each template's structured data is validated on save against a schema
- Each template renders with a dedicated theme component, with sensible defaults
- Each template can emit JSON-LD for SEO
- Built-in templates ship with Carbon (`article`, `recipe` for v1)
- Themes can contribute new template kinds without a Carbon release
- Switching themes is non-destructive — posts retain their template, render with a graceful fallback if the active theme doesn't know the kind

### Non-Goals (this phase)

- Admin-defined templates without code (a "design your own template" UI in the admin) — Phase 3
- Per-resource scoping or row-level template permissions
- Template versioning and migration tooling
- A marketplace for third-party templates
- Replacing the existing comment / media / editorial-workflow systems with template-based equivalents

---

## Data Model

Two columns added to the `posts` table:

```ts
template: text("template").notNull().default("article"),
structuredData: jsonb("structured_data").notNull().default({}),
```

- `template` is the registry key (`"article"`, `"recipe"`, `"event"`). Always present; defaults to `"article"` so existing posts have well-defined behavior post-migration.
- `structuredData` is the per-template payload. JSON shape is validated against the template's schema on insert/update; never validated on read (so posts using a vanished template still load).

`structuredData` is `jsonb` rather than per-template tables specifically to enable theme-contributed templates without a Carbon release. New template kinds add no schema migrations.

### Migration

Add the two columns. Backfill existing rows:
- `template = "article"`
- `structuredData = {}`

The `article` template defines no additional fields, so existing post rendering is unaffected.

### Indexing

Add an index on `template` for filtering ("show all recipes"). No index on `structuredData` initially; if a real query against jsonb keys becomes hot we add a GIN index later.

---

## Template Module Contract

A template is a module that exports:

```ts
export interface PostTemplate<S extends z.ZodTypeAny = z.ZodTypeAny> {
  // Persistent identifier. Stored on every post that uses this template.
  // Once published, never renamed (would orphan existing posts).
  kind: string;

  // Admin-facing label and short description.
  label: string;
  description?: string;

  // Zod schema for structuredData. The API validates submitted data
  // against this on insert/update.
  schema: S;

  // Frontend render component. Receives the parsed structured data
  // and the surrounding post, and is responsible for rendering the
  // entire post body area — including post.content where applicable.
  // Layout choices (e.g. whether a structured panel sits above or
  // below the body) live inside the template's render or in its
  // structuredData schema, not in the registry.
  Render: React.FC<{ post: Post; data: z.infer<S> }>;

  // Optional admin editor. If omitted, the admin auto-generates a
  // form from the Zod schema (see "Admin UX").
  AdminEditor?: React.FC<{
    value: z.infer<S>;
    onChange: (next: z.infer<S>) => void;
  }>;

  // Optional JSON-LD generator. Output is injected into the page head.
  jsonLd?: (post: Post, data: z.infer<S>) => Record<string, unknown>;

  // Optional print stylesheet, scoped to the template's render output.
  printStyles?: string;
}
```

Each consumer imports only what it needs:

- **API** imports `kind`, `schema` (for validation)
- **Admin** imports `kind`, `label`, `description`, `schema`, `AdminEditor`
- **Frontend** imports `kind`, `Render`, `jsonLd`, `printStyles`

In Solo mode this is a single TypeScript module per template. In decoupled mode the splits matter (see "Schema Propagation").

---

## Built-in vs Theme-Contributed Templates

Two registration sources:

### Built-in

Live in `packages/api/src/templates/` (and corresponding admin / frontend folders). Always available across all themes. Ship with Carbon; new built-in templates require a Carbon release.

V1 set:
- `article` — no structured fields. The default for existing and new posts. Its `Render` is the existing post-body component (renders `post.content`); the migration to "everything is a template" is therefore a refactor of the render layer, not a behavior change for users.
- `recipe` — full structured fields including a `panelPlacement: "top" | "bottom"` choice for where the recipe panel sits relative to the body. Custom AdminEditor, JSON-LD `Recipe`, print stylesheet.

### Theme-contributed

A theme can export a `templates` array. When the theme is activated, Carbon registers those templates. When the theme is deactivated, they unregister.

```ts
// inside a theme's index.ts
export const templates = [
  bookReviewTemplate,
  podcastEpisodeTemplate,
];
```

Theme-contributed templates have the same shape as built-in templates but are scoped to the theme's lifecycle.

A new built-in **Library** theme ships in PR C as the first real consumer of this mechanism. It contributes a `book-review` template (rating, author, book metadata, optional excerpt) and provides a layout suited to a book-review blog. This serves three purposes:

1. Exercises the theme-contribution flow in CI — round-tripping a real schema and render through the registration and validation paths
2. Demonstrates the contract for theme authors — a working example to copy from
3. Gives non-engineer adopters running a book-review blog a starting point

### Trust model

Both built-in and theme-contributed templates run in the same process as Carbon. This matches the existing trust model for themes (already trusted code). No sandboxing for v1 — admin-installed themes are trusted. This is the same compromise WordPress makes and is appropriate for the "non-engineer self-hosted install" target.

---

## Schema Propagation (Decoupled Mode)

In Solo mode the API, admin, and frontend share a process and import the registry directly. In decoupled mode they're separate services and the schema must propagate.

Proposed flow:

1. **Theme activation** — frontend service detects the active theme has a `templates` export, converts each Zod schema to JSON Schema (via `zod-to-json-schema`), and POSTs the manifest to `/api/v1/templates/register` with the theme's identity.
2. **API persistence** — API stores manifests in a new `template_schemas` table (`theme_id`, `kind`, `label`, `json_schema`, `placement_override`). Built-in templates are not in this table; they live in code.
3. **API validation on save** — for each post update, look up the schema (built-in by kind, or theme-contributed by `(active_theme_id, kind)`) and validate `structuredData` with `ajv` against the JSON Schema.
4. **Admin form generation** — admin fetches `/api/v1/templates` (returns built-ins + active theme's contributed templates) and generates forms from the JSON Schema. For templates with custom AdminEditors, those are loaded by the admin (Phase D — see "Phased Delivery").
5. **Theme deactivation** — frontend POSTs `/api/v1/templates/unregister` with the theme identity. API marks contributed schemas inactive (kept for historical posts; not used for validation of new writes).

**Why JSON Schema in the DB rather than re-importing Zod across services:** Zod schemas can include arbitrary refinements (custom JS validators) that don't serialize. JSON Schema is a portable subset; what we lose in expressiveness we gain in cross-service portability. Templates that need exotic validation can do it client-side in their AdminEditor and accept that the API check is best-effort (still catches the 99% case of wrong types).

---

## Theme-Switch Fallback

When a theme that contributed templates is deactivated, posts using those template kinds remain in the database with their `template` and `structuredData` intact. Render behavior:

- If the active theme can render the kind (built-in, or also contributed by the active theme) → normal rendering
- Otherwise → frontend renders the post's regular content, skips the structured panel, omits the JSON-LD. Optionally adds a hidden `<meta name="carbon-template-fallback" content="<kind>">` for diagnostics.

The admin shows a banner on impacted posts: *"This post uses the `recipe` template, which is not provided by the active theme. The structured panel is hidden until you activate a theme that provides it."*

Theme-switch confirmation in the admin counts impacted posts: *"Switching from `Cookbook Theme` to `Default Theme` will hide the recipe panel on 47 posts. Continue?"*

This makes template kinds **durable identifiers** — the data is never destroyed by theme operations. Switching back restores rendering.

### Conflicting schemas

If two themes contribute the same kind with incompatible schemas, the **active theme's schema wins** for new writes. Existing posts that don't validate against the new schema show a per-post warning in the admin: *"This post's data doesn't match the current template schema."* Editing forces re-validation; reading still works.

This punts on real schema migration tooling (Phase 3+).

---

## Admin UX

The post editor gains a template picker at the top: a dropdown of available kinds (built-in + active theme contributed), labeled and described. Changing the template clears `structuredData` (with a confirm prompt if data exists).

Below the title and above the rich-text editor, a **"Template fields"** section renders the structured form:

- If the template provides an `AdminEditor`, render that component
- Otherwise, render an auto-generated form from the schema:
  - `string` → text input
  - `string` with `enum` → dropdown
  - `number` / `int` → number input
  - `boolean` → checkbox
  - `array<string>` → tag-style list input
  - `object` → nested fieldset
  - Recursive nesting supported

The auto-generated form covers maybe 70% of templates. Custom `AdminEditor` is the escape hatch for templates with non-trivial UX needs (recipe instructions with per-step images, event RSVP integration, etc.).

### Validation

Form submit triggers client-side Zod validation (when the AdminEditor is loaded with the schema) for fast feedback. The API re-validates on save and returns field-level errors that the form surfaces.

---

## Frontend Rendering

Themes render the entire post body area through a single dispatcher:

```tsx
<TemplateRenderer post={post} />
```

`TemplateRenderer` looks up the template by `post.template` and renders the template's `Render` component, passing the parsed `structuredData`. The template's `Render` is responsible for the entire body area — including `post.content` where applicable. There is no separate `<PostBody>` component; the `article` template *is* the post-body renderer.

This collapses what would otherwise be a custom-vs-default render path into one flow: every post is rendered by exactly one template's `Render`. Templates that mix structured panels with regular body content (recipe, book-review) handle the layout internally — including any "configurable placement" choice, which lives in the template's structured data:

```ts
// recipe template schema (excerpt)
panelPlacement: z.enum(["top", "bottom"]).default("top"),
```

The recipe `Render` reads `data.panelPlacement` and arranges the panel and `post.content` accordingly. Templates that don't have a layout choice simply don't include one in their schema.

### JSON-LD

The frontend page renders `<TemplateJsonLd post={post} />` in `<head>`, which calls the template's `jsonLd(post, data)` and emits a `<script type="application/ld+json">` tag. Templates without a `jsonLd` hook contribute nothing.

### Print stylesheet

Templates can ship `printStyles: string` — a CSS string scoped (via a wrapper class) to the template's rendered DOM. Carbon emits `<style media="print">` in the page head when a template with print styles is rendered. This keeps recipe printability working without theme cooperation.

---

## SEO

Recipe specifically targets [Google's Recipe rich result](https://developers.google.com/search/docs/appearance/structured-data/recipe). The recipe template's `jsonLd` produces:

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "...",
  "image": ["..."],
  "author": { "@type": "Person", "name": "..." },
  "datePublished": "...",
  "description": "...",
  "recipeIngredient": [...],
  "recipeInstructions": [{ "@type": "HowToStep", "text": "..." }, ...],
  "prepTime": "PT15M",
  "cookTime": "PT45M",
  "totalTime": "PT60M",
  "recipeYield": "4 servings"
}
```

Future templates that have schema.org equivalents (`Event`, `Product`, `Review`, `Article`) plug in the same way — implement `jsonLd`, get rich snippets.

---

## Phased Delivery

Atomic PRs in dependency order:

### PR A — Substrate

- Schema migration: `template`, `structuredData` columns + index on `template`
- Template registry (in-process Map populated at boot)
- Built-in `article` template — its `Render` is the existing post-body component, lifted into the template module. No structured fields, no JSON-LD. Behavior for existing posts is unchanged; the change is structural.
- Validation in `POST /api/v1/posts` and `PUT /api/v1/posts/[id]` against the resolved template's schema (no-op for `article` since the schema is empty)
- Admin: template picker on the post editor (only `article` available at this point), auto-generated form for templates without a custom `AdminEditor`
- Frontend: `<TemplateRenderer post={post} />` as the single dispatcher; existing `<PostBody>` callers in themes migrate to `<TemplateRenderer>`
- `<TemplateJsonLd>` component (no-op for `article`)
- Tests: schema validation matrix; template registry invariants; auto-form generation for representative schema shapes; existing post-render snapshots preserved through the refactor

### PR B — Recipe Template

- `recipe` template module: schema, custom `RecipeEditor`, `Render`, `jsonLd`, `printStyles`
- Default theme + minimal theme each get a recipe render component
- Tests: schema validation against valid/invalid recipe payloads; JSON-LD output shape against schema.org Recipe spec

### PR C — Theme-Contributed Templates + Library Theme

- `template_schemas` table for persisted theme manifests
- `POST /api/v1/templates/register` endpoint (called by frontend on theme activation)
- `POST /api/v1/templates/unregister` endpoint (called on deactivation)
- `GET /api/v1/templates` returns built-ins + currently-active theme contributions
- Admin: template picker shows theme-contributed kinds; theme-switch confirmation surfaces impacted-post counts
- Frontend: fallback rendering for unknown kinds; admin banner on impacted posts
- Schema-conflict handling (active theme wins)
- New built-in **Library** theme that contributes the `book-review` template — schema, render, optional `jsonLd` for schema.org `Book` / `Review`, no custom AdminEditor (auto-gen is sufficient for v1)
- Tests: schema-propagation round-trip via Library theme activation; theme-deactivation preserves data; switching themes flips renderable kinds correctly; book-review posts created under Library remain valid after deactivation

### PR D — Custom AdminEditor for Theme-Contributed Templates

- Theme-contributed templates can ship a React `AdminEditor`
- Loading mechanism for theme-contributed React code in the admin process (decoupled mode complication: admin is a separate service from the theme's home in the frontend service)
- Trust model documentation: theme-contributed AdminEditors run in the admin process; same trust as theme code already has
- Defer until C is shipped and we see the actual integration shape

PRs A and B together unlock recipe sites. PRs C and D unlock the third-party template ecosystem.

---

## Resolved Decisions

1. **Theme-contribution proof in PR C** — ship a built-in **Library** theme that contributes a `book-review` template. Real working example, exercises the round-trip in CI, gives book-review-blog adopters a starting point. (Better than a synthetic test fixture.)
2. **`article` template render** — move post-body rendering fully inside the template system. Every post is rendered by exactly one template's `Render`. The `article` template's `Render` is the existing post-body component, lifted into the template module. Single render flow, no special-cased default path. Bigger refactor in PR A but a simpler steady state.
3. **JSON-LD opt-in vs always-on** — always-on when a template provides a `jsonLd` hook. The opt-out edge cases (rare to nonexistent in practice) can be addressed by a per-post `seoSuppress` boolean later, not by complicating the template contract now.
4. **Preview / test mode** — UX nice-to-have, not a substrate requirement. The recipe editor in PR B may include an inline preview pane; book-review (PR C) probably doesn't need one. Generic preview is its own feature, deferred.

## Open Questions

(None blocking implementation at this point. Anything that surfaces during PR A development gets logged here for future reference.)

---

## Out of Scope

These are deliberately deferred and should not creep into the Phase 2 PRs:

- Widgets (the original Phase 2 candidate, shelved in favor of templates)
- Plugins (Phase 3; webhooks already cover the basic out-of-process extension shape)
- Admin-defined templates without code (Phase 3)
- Per-template comment configurations
- Template-based search filters in the admin
- Cross-template references (a recipe linking to required equipment in a `product` template)
- Versioning of template schemas
