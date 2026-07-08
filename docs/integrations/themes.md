# Custom Themes

A **theme** decides how your public site looks: the layout, the blog list, individual post pages, the search page, the 404 — the whole visual surface of what your readers see. Carbon ships two built-in bases, and lets you copy either one, edit the files, and activate the result as your own custom theme. No plugin system, no build tooling, no Node modules to publish — just six React files on disk that Carbon compiles for you when you click **Compile** in admin.

If you can write TSX and Tailwind (or plain HTML), you can theme a Carbon site.

---

## Getting there

In the admin sidebar, open **Themes**. You'll see the built-in themes listed at the top and any custom themes below. Click **New theme**, pick a base, give it a slug, and hit **Create**.

Behind the scenes, Carbon copies the base's files into `CUSTOM_THEMES_DIR/<your-slug>/`, generates a fresh `theme.config.json`, and runs the compiler. When it finishes, your theme is discoverable and ready to activate.

Edit the files on disk, click **Compile** again to rebuild, and **Activate** to switch your public site to the new theme.

---

## Which base should I copy?

| Base | Copy this when… |
|---|---|
| **`default`** | You want a Tailwind-styled, opinionated starting point. Six files with a working layout, blog list, post detail, page renderer, search, and 404 — all styled with neutral typography and prose classes. Best if you plan to keep the shape and just re-skin. |
| **`minimal`** | You want the bare skeleton. Six files with semantic HTML, zero styling, no design decisions to unwind. Best if you plan to build the visual design from scratch. |

Both bases compile out of the box and are safe to activate as-is — the difference is only what you start editing from.

---

## The six-file contract

Every theme must ship exactly six files at the top of its directory:

```
mytheme/
├── layout.tsx        exports SiteLayout
├── blog-index.tsx    exports BlogIndex
├── blog-post.tsx     exports BlogPost
├── page.tsx          exports PageContent AND PageBlocks
├── search.tsx        exports SearchPage
├── not-found.tsx     exports NotFound
└── theme.config.json (auto-generated on create)
```

Missing any one of them and the compiler will fail. This is enforced at theme-creation time — if the base you copy is incomplete, Carbon refuses to create the theme and tells you which files are missing. You won't discover the gap later at compile time.

The `page.tsx` requirement to export **both** `PageContent` and `PageBlocks` deserves a callout: `PageContent` renders raw-HTML pages, `PageBlocks` renders page-builder pages. A theme missing `PageBlocks` will compile fine but crash at runtime the first time a reader hits a page-builder page. Both bases satisfy this, so you're set if you start from a base.

---

## What you can import

Custom themes are compiled in a sandbox. Only these imports resolve:

- `react`, `react/jsx-runtime`, `react-dom`
- `next`, `next/link`, `next/image`, `next/navigation`, `next/headers`
- `lucide-react` (icon set)

Anything else — including `@/*` path aliases, `next-auth/react`, your own utility modules, or any npm package you `npm install` locally — will fail to resolve at compile time.

This intentionally keeps custom themes portable and safe: they can't reach into Carbon internals, ship their own auth logic, or pull in an arbitrary dependency graph. If you find yourself wanting to import something outside this list, either inline the logic into your theme file or [open an issue](https://github.com/mpfrazer/carbon-cms/issues) — the whitelist evolves conservatively as real needs surface.

Types you need — `PostSummary`, `SearchResult`, block shapes — should be **inlined** in each file rather than imported from a shared module. Both bases do this. The trade-off is minor duplication in exchange for portability.

---

## Authoring workflow

1. **Create.** Admin → Themes → New theme, pick your base, give it a slug (lowercase, hyphens, e.g. `my-brand`).
2. **Edit.** Open `CUSTOM_THEMES_DIR/my-brand/` in your editor. Files are plain TSX. Save changes to disk.
3. **Compile.** In admin → Themes, click **Compile** on your theme. Carbon runs esbuild against the six files with the externals list above. If any imports fail to resolve, the compile output shows which file and what import — fix and re-compile.
4. **Activate.** Once your theme is marked as **Compiled**, click **Activate**. Your public site immediately renders through your files.
5. **Iterate.** Each save-then-compile is fast. You can compile as many times as you like without re-creating the theme.

If you need to start over, delete the theme's directory and re-create from a base.

---

## Where custom themes live

On a Docker self-host, `CUSTOM_THEMES_DIR` defaults to `/custom-themes` inside the API container. If you're editing themes from the host, mount a directory over that path so your files persist across container restarts. On a `npm run dev` workflow, the default is `<repo>/../../custom-themes/` — set `CUSTOM_THEMES_DIR` explicitly if that's not where you want them.

The compiler writes compiled output to `CUSTOM_THEMES_DIR/.cache/<slug>/*.js`. The frontend reads from `.cache` for rendering and stats the source `.tsx` for staleness checks, so the two must be on the same volume. See [deployment docs](../architecture/deployment-modes.md) for the Docker-side mount.

---

## What if my compile fails?

The compile output in admin shows the esbuild error verbatim, including the file and the failing import. The most common causes:

- **Unresolved import** — you imported something outside the whitelist. Inline the logic or find a whitelisted alternative.
- **JSX syntax error** — a typo or unclosed tag. Fix and re-compile.
- **Missing export** — the compiler builds each entry point but the runtime later expects specific named exports (e.g. `SiteLayout` from `layout.tsx`). If those don't exist, compile passes but activation surfaces the runtime crash. Check both bases for the exact export names required.

If you're stuck, the built-in `default` and `minimal` bases are always the reference implementation. Diff your file against theirs to find the divergence.

---

## Future considerations

- **Theme-contributed post templates** already work — see [Post Templates](templates.md). A theme can ship structured content types (like `recipe`) that its `blog-post.tsx` renders. See the `library` built-in theme for an example.
- **Admin-editor overrides** (custom form widgets for template fields) are supported for built-in themes only. Publishing custom-theme admin editors is on the roadmap.
