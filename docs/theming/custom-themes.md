# Custom Themes

A custom theme is a directory of React/TypeScript files that controls every visual aspect of the public site. Custom themes are compiled at runtime via esbuild and hot-swapped without redeploying the application.

**Prerequisites:** TypeScript and React experience. Themes are `.tsx` files — plain HTML knowledge is not enough.

---

## Creating a custom theme

1. In the admin, go to **Themes**.
2. Click **New theme**.
3. Enter a slug (URL-safe name, e.g. `my-brand`) and choose a base theme to copy from.
4. Click **Create**. Carbon copies the base theme's source files into the custom themes directory and creates a fresh `theme.config.json`.

The new theme appears in the theme list immediately. It won't be usable until you compile it.

---

## File structure

Each theme is a directory containing these files:

```
custom-themes/
  my-brand/
    layout.tsx          ← Site chrome: header, nav, footer
    blog-index.tsx      ← Blog listing page
    blog-post.tsx       ← Individual post page
    page.tsx            ← Static pages (rich-text and block-builder)
    search.tsx          ← Search results page
    not-found.tsx       ← 404 page
    theme.config.json   ← Metadata, capabilities, overrides, variables
    globals.css         ← Optional: theme-scoped styles
```

All six `.tsx` files are required. The compiler expects every file to be present.

---

## Required exports

Each file must export a named component. The component names are fixed:

| File | Required export |
|------|----------------|
| `layout.tsx` | `SiteLayout` |
| `blog-index.tsx` | `BlogIndex` |
| `blog-post.tsx` | `BlogPost` |
| `page.tsx` | `PageContent`, `PageBlocks` |
| `search.tsx` | `SearchPage` |
| `not-found.tsx` | `NotFound` |

### `SiteLayout`

The top-level shell. Renders the header, nav, and footer, with `children` as the page content.

```tsx
export function SiteLayout({
  siteTitle,       // string — site name from settings
  navPages,        // { label: string; href: string }[] — nav menu items
  searchMode,      // "none" | "header" | "page"
  searchInputMode, // "submit" | "instant"
  children,        // React.ReactNode
  user,            // { name: string; role: string; avatarUrl?: string | null } | null
  logoUrl,         // string | null — from appearance settings
  footerText,      // string | null — from appearance settings
  simplified,      // boolean — true on auth pages (hide nav/footer)
  showBlogLink,    // boolean — whether to show the blog link in nav
}: SiteLayoutProps) { ... }
```

`searchMode` is resolved from the theme's capabilities and any overrides, plus the admin's search settings. When `searchMode === "header"`, render a search input in the header. When `"page"`, render a link to `/search`. When `"none"`, omit search entirely.

### `BlogIndex`

The blog listing page. Props are passed through from the Carbon API — type them as `any` or define your own interface based on what the API returns.

```tsx
export function BlogIndex(props: any) { ... }
```

The API response for the blog index includes: `posts` (array with `title`, `slug`, `excerpt`, `featuredImageUrl`, `publishedAt`, `author`, `categories`, `tags`), `pagination`, `category` (if filtered), `tag` (if filtered).

### `BlogPost`

An individual post page. Same approach — type the props as `any` or define an interface.

```tsx
export function BlogPost(props: any) { ... }
```

Props include: `post` (full post object with `title`, `slug`, `content`, `excerpt`, `featuredImageUrl`, `publishedAt`, `author`, `categories`, `tags`, `metaTitle`, `metaDescription`), `prevPost`, `nextPost`, `comments` (if comments are enabled).

### `PageContent`

A static page rendered from rich-text HTML:

```tsx
export function PageContent({
  title,     // string
  content,   // string — HTML from the rich-text editor
  updatedAt, // Date
}: { title: string; content: string; updatedAt: Date }) { ... }
```

### `PageBlocks`

A static page rendered from the block builder:

```tsx
import type { PageBlock } from "@carbon-cms/frontend/lib/blocks";

export function PageBlocks({
  title,  // string
  blocks, // PageBlock[]
}: { title: string; blocks: PageBlock[] }) { ... }
```

Block types: `text` (HTML content), `hero` (heading, subheading, CTA), `image` (url, alt, caption, fullWidth), `columns` (array of HTML content), `cta` (heading, body, buttonText, buttonUrl).

### `SearchPage`

The search results page:

```tsx
export function SearchPage({
  query,     // string — the search query
  results,   // SearchResult[] — matching posts and pages
  total,     // number — total result count
  inputMode, // "submit" | "instant"
}: SearchPageProps) { ... }
```

`SearchResult`: `{ type: "post" | "page"; id: string; title: string; slug: string; excerpt: string | null; publishedAt: string | null; url: string }`

### `NotFound`

The 404 page. Receives no props:

```tsx
export function NotFound() { ... }
```

---

## CSS variables

Carbon injects these custom properties into `:root` on every page. Use them in your theme to stay in sync with the user's appearance settings.

### Appearance variables (always present)

| Variable | Set by |
|----------|--------|
| `--carbon-accent` | Accent color in appearance settings |
| `--carbon-font-body` | Body font stack (e.g. `'Inter', system-ui, sans-serif`) |
| `--carbon-font-heading` | Heading font stack |
| `--carbon-font-heading-weight` | Heading weight (e.g. `700`) |

Example usage:

```css
a {
  color: var(--carbon-accent);
}

body {
  font-family: var(--carbon-font-body);
}

h1, h2, h3 {
  font-family: var(--carbon-font-heading);
  font-weight: var(--carbon-font-heading-weight);
}
```

### Theme variables

If your theme defines variables in `theme.config.json`, their values are also injected into `:root`. The variable name is `--` + the `key` field:

```json
{ "key": "heroBackground", "default": "#f5f5f5" }
```

```css
.hero {
  background-color: var(--heroBackground);
}
```

---

## `theme.config.json` reference

```json
{
  "name": "My Brand",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Custom theme for My Brand.",
  "capabilities": {
    "blog": true,
    "search": { "header": true, "page": true },
    "pageBuilder": true,
    "comments": true
  },
  "overrides": {
    "searchMode": "header",
    "searchInputMode": "instant",
    "showBlogLink": true,
    "postsPerPage": 12
  },
  "variables": [
    {
      "key": "heroBackground",
      "label": "Hero background color",
      "type": "color",
      "default": "#f5f5f5"
    },
    {
      "key": "cardRadius",
      "label": "Card border radius",
      "type": "select",
      "default": "0.5rem",
      "options": ["0", "0.25rem", "0.5rem", "1rem"]
    },
    {
      "key": "contentWidth",
      "label": "Max content width",
      "type": "select",
      "default": "768px",
      "options": ["640px", "768px", "900px", "1024px"]
    },
    {
      "key": "postsPerRow",
      "label": "Posts per row (blog index)",
      "type": "number",
      "default": 3
    },
    {
      "key": "cardStyle",
      "label": "Card style",
      "type": "select",
      "default": "bordered",
      "options": ["bordered", "shadowed", "flat"]
    }
  ]
}
```

### `capabilities`

Tells Carbon which features your theme supports. These affect what settings appear in the admin and how the frontend routes are configured.

| Key | Type | Description |
|-----|------|-------------|
| `blog` | boolean | Whether the theme renders the blog section |
| `search.header` | boolean | Whether the theme can show search in the header |
| `search.page` | boolean | Whether the theme renders a dedicated search page |
| `pageBuilder` | boolean | Whether the theme renders page-builder block layouts |
| `comments` | boolean | Whether the theme displays the comments section on posts |

If your theme doesn't support a capability, set it to `false`. The admin will hide the corresponding settings.

### `overrides`

Hard-code behavior regardless of admin settings. Useful when your theme's design requires a specific configuration.

| Key | Type | Description |
|-----|------|-------------|
| `searchMode` | `"none"` \| `"header"` \| `"page"` | Force a specific search presentation |
| `searchInputMode` | `"submit"` \| `"instant"` | Force search input behavior |
| `showBlogLink` | boolean | Force the blog link in nav on or off |
| `postsPerPage` | number | Override the admin's posts-per-page setting |

All overrides are optional. Omit a key to let the admin setting take precedence.

### `variables`

An array of customization inputs exposed in the admin's **Theme variables** panel. Each variable is injected as a CSS custom property.

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | CSS variable name (without `--`). Must be unique within the theme. |
| `label` | string | Human-readable label shown in the admin. |
| `type` | `"color"` \| `"string"` \| `"number"` \| `"select"` | Input type shown in the admin. |
| `default` | string \| number | Value used when the user hasn't saved a custom value. |
| `options` | string[] | Required when `type` is `"select"`. The values shown as options. |

Variable values are injected into `:root` as `--{key}: {value}`.

---

## Available packages

The esbuild compiler bundles your theme files for Node.js. The following packages are treated as **externals** — they are not bundled and are provided by the runtime:

- `react`
- `react/jsx-runtime`
- `react-dom`
- `next`
- `next/link`
- `next/image`
- `next/navigation`
- `next/headers`
- `lucide-react`

You can import any of these freely. Any other dependency you import will be bundled into the compiled output — make sure it's available in `node_modules` at compile time.

> **Note:** Do not import from `@carbon-cms/*` internal packages in custom themes. Use the externals above and the standard React APIs.

---

## Compiling

After editing source files on disk, go to **Admin → Themes**, find your custom theme, and click **Compile**. The admin shows a live build status and surfaces any TypeScript/esbuild errors inline.

Fix any reported errors, then compile again. Once the build succeeds, you can activate the theme.

### Common errors

| Error | Likely cause |
|-------|-------------|
| `Cannot find module '...'` | You imported a package that isn't installed or isn't an external |
| `Expected 'X' to be exported` | A required named export is missing from the file |
| `Type error: Property 'X' does not exist` | TypeScript strict mode caught a prop mismatch — check your component signature |

---

## Editing theme config in the admin

You don't need to edit `theme.config.json` by hand. In the admin, click the **Configure** button on your theme card to open an editor that lets you:

- Toggle capabilities
- Set overrides
- Add, edit, and remove variable definitions

Changes are written back to `theme.config.json` automatically. The theme does not need to be recompiled after a config change — variable values and capabilities are read at request time.

---

## Fallback behavior

If the active theme fails to load (missing files, compile error), Carbon falls back to the Default theme automatically. This prevents a broken custom theme from taking down the public site.
