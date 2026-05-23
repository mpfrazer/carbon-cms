# Post Templates

Every post in Carbon has a **template** — a name that decides what extra structured fields the post carries, how its body area renders on the public site, and what kind of [JSON-LD](https://schema.org/) markup it emits for search engines.

The default template is `article`: title, body, the basics. Other templates add structured fields on top — a `recipe` post has ingredients, prep time, cook time, instructions, and a print-friendly layout. Theme authors can ship new template kinds without a Carbon release.

If you've ever wished Carbon could power a recipe site, an event listing, a podcast index, a product review blog, or anything else with consistently-structured content, templates are how.

---

## Getting there

In the admin sidebar, open **Posts → New post** (or edit an existing post). The template picker is right below the slug field. Pick a template, fill in the structured fields, save.

For existing posts the picker defaults to `article`. You can switch templates at any time — see [Switching templates](#switching-templates) for what happens to data.

---

## Built-in templates

Carbon ships two templates out of the box:

| Template | Use it for | Adds these fields |
|---|---|---|
| **Article** | Standard blog posts, essays, anything that's just title + body | (none) |
| **Recipe** | Cooking recipes with consistent formatting | Prep / cook time, servings, ingredients, instructions (with optional per-step images), cuisine, course, difficulty, source URL, panel placement |

Both templates are always available, regardless of which theme is active.

### Recipe specifics

Recipe posts get extra polish:

- **A summary card** at the top of the post (prep / cook / total / yield)
- **Structured ingredients and instructions panel** above or below the body, controlled by the per-post "Panel" setting in the editor
- **Print stylesheet** — when readers print the page, they get just the recipe, formatted for paper. No nav, no comments, no story.
- **Schema.org Recipe JSON-LD** in the page head, targeting [Google's Recipe rich result](https://developers.google.com/search/docs/appearance/structured-data/recipe). Recipes show up in search with the photo, time, and rating right in the results.

The recipe editor in the admin includes a media picker for per-step images and a reorder control for shuffling instructions.

---

## Switching templates

Changing a post's template clears its existing structured fields — Carbon asks you to confirm if there's any data to lose. The post's title, body, slug, taxonomy, comments, and revisions are untouched; only the template-specific fields (ingredients, ratings, etc.) reset.

This is intentional: structured fields are schema-validated, and the new template's schema won't accept the old template's shape. Switching from recipe to article drops the ingredients list; switching back means starting fresh.

If you're switching templates often on the same post, you're probably reaching for the wrong tool — different templates are meant for different *kinds* of content.

---

## Theme-contributed templates

Themes can extend Carbon with new template kinds without a Carbon release. The built-in **Library** theme is the canonical example: activating it adds a `book-review` template with star rating, author, genre, ISBN, and a [schema.org Review](https://schema.org/Review) JSON-LD output.

### How it works

1. Activate a theme (e.g. Library) from **Themes** in the admin
2. The frontend service registers the theme's templates with the API the first time a page renders under the new theme. After that, the new template kinds appear in the post editor's template picker labeled "(from active theme)"
3. The post editor shows the appropriate authoring UI — either a custom one shipped by the theme, or an auto-generated form from the template's schema

### What happens when you switch themes

Posts retain their template kind forever — the data is never destroyed by a theme change. But rendering depends on whether the active theme provides that kind:

- **Active theme provides it** → normal rendering with the structured panel + JSON-LD
- **Active theme doesn't provide it** → graceful fallback: the post body renders without the structured panel, JSON-LD is omitted. The post page still works; it just loses the rich layout.
- **Switching back** restores the rich rendering immediately

When you switch themes in the admin, Carbon counts how many posts would lose their structured panel and asks you to confirm. Cancel to stay on the current theme; continue to proceed knowing some posts will degrade.

> **Note.** A theme's contributed templates only become known to the API after its first activation. That means the switch-confirmation count may be conservative the first time you activate a new theme — it'll list kinds the theme actually provides as "missing." Activate once to populate the registry, then theme switches show accurate counts.

### Per-post banner

If you open a post in the editor whose template the active theme doesn't provide, you'll see an amber banner saying so. The post's structured data is preserved; the structured-fields editor is hidden until a theme that provides the template is reactivated.

---

## SEO and rich results

Templates with a `jsonLd` hook emit [schema.org](https://schema.org/) JSON-LD into the page head automatically. Today:

- **Recipe** → `Recipe` (Google rich result)
- **Book review** (Library theme) → `Review` with `itemReviewed: Book`

This is on top of Carbon's standard `BlogPosting` JSON-LD that all post pages emit. There's no admin toggle — if a template provides JSON-LD, it's always on. Verify the output with [Google's Rich Results Test](https://search.google.com/test/rich-results).

---

## For theme authors

Themes can contribute new template kinds by exporting a `templates` array from a `templates.tsx` module:

```ts
// packages/frontend/src/themes/<your-theme>/templates.tsx
import { z } from "zod";
import type { FrontendTemplate } from "@/templates/registry";

const myTemplateSchema = z.object({
  someField: z.string(),
  someNumber: z.number().int().min(0),
}).strict();

const myTemplate: FrontendTemplate = {
  kind: "my-template",        // lowercase, hyphenated, persistent identifier
  Render: ({ post, data }) => <div>{/* your render */}</div>,
  jsonLd: (post, data) => ({  // optional
    "@context": "https://schema.org",
    "@type": "Thing",
    name: post.title,
  }),
  printStyles: `              // optional CSS string
    @media print {
      .my-template { /* ... */ }
    }
  `,
};

export const templates = [
  {
    kind: myTemplate.kind,
    label: "My Template",
    description: "What this template is for.",
    schema: myTemplateSchema,
    template: myTemplate,
  },
];
```

When the theme is activated:

1. The frontend converts each Zod schema to JSON Schema via `z.toJSONSchema` and POSTs the manifest to `/api/v1/templates/register`
2. The API persists the JSON Schema in the `template_schemas` table and uses it to validate `POST /api/v1/posts` and `PUT /api/v1/posts/[id]` writes
3. The admin fetches `/api/v1/templates` on the post editor and offers your template kind in the picker

The template's `Render` component receives `{ post, data }` and owns the entire post body area — render `post.content` yourself where appropriate.

### Custom admin editors (built-in themes only, for now)

The post editor uses an auto-generated form by default — derived from your Zod schema, handles primitives, enums, optional fields, arrays of primitives, and nested objects. If you want richer authoring UX (custom controls, media picker integration, drag-to-reorder), ship a React component as an admin editor:

```ts
// packages/admin/src/themes/<your-theme>/admin-editors.ts
import { MyTemplateEditor } from "./my-template-editor";

export const adminEditors = {
  "my-template": MyTemplateEditor,
};
```

Each admin editor receives `{ value, onChange }` and is responsible for rendering controls and emitting updates. See `packages/admin/src/themes/library/book-review-editor.tsx` for a working example (star-picker rating control).

> **Currently limited to built-in themes.** Custom (non-built-in) themes can't yet ship admin-editor code — there's no packaging mechanism for shipping React to the admin package out-of-tree. Auto-form works fine for those; the custom-editor path is queued for a follow-up phase.

### Trust model

Templates run in the same processes as Carbon — your `Render` runs in the frontend, your `AdminEditor` runs in the admin, your `schema` validates writes in the API. There's no sandboxing. Themes are trusted code at install time, same compromise WordPress makes. Don't install themes you don't trust.

---

## Known gaps

- **Theme-contributed kinds are unknown until first activation.** The impact warning when switching themes can flag a theme's own contributed kinds as "missing" the first time you activate it. Pre-registration via a static manifest is a planned improvement.
- **Custom themes can't ship admin editors.** Only built-in themes (Library) can use the custom-AdminEditor path. Custom themes fall back to auto-form. Packaging mechanism for third-party admin code is queued for a follow-up phase.
- **No admin-defined templates.** You can't compose a new template kind from the admin UI — schemas require code. This is a long-term Phase 3 item; for now templates live in `packages/frontend/src/themes/<slug>/templates.tsx` (theme-contributed) or in `packages/api/src/lib/templates/` (built-in).
- **No template schema migrations.** If a theme version changes its template schema, existing posts may have data that no longer validates. The post editor surfaces a warning when this happens, but there's no migration tooling — the operator has to edit affected posts manually.
- **No structured-data search.** Carbon's search doesn't index `structuredData` jsonb — you can't search "all recipes under 30 minutes." Posts are searchable by title, content, and taxonomy as usual.
