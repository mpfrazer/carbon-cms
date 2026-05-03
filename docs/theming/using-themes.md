# Using Themes

Themes control the visual appearance of your public-facing site — the layout, typography, colors, and overall design. This guide covers everything available in the **Themes** section of the Carbon admin.

---

## Getting there

In the admin sidebar, click **Themes**. The page is split into two tabs:

- **Themes** — pick and activate a theme, manage custom themes
- **Appearance** — tweak colors, fonts, logo, and footer text

---

## Built-in themes

Carbon ships with two themes out of the box:

| Theme | Description |
|-------|-------------|
| **Default** | Clean, readable layout with a hero section on the blog index. Supports all Carbon features. |
| **Minimal** | Stripped-back design focused purely on typography and readability. |

Both themes support the blog, page builder blocks, search, and comments.

---

## Activating a theme

Click the theme card you want, then click **Activate**. The active theme is highlighted with a solid border. Theme changes take effect immediately — visitors see the new design on their next page load.

> If you have a custom theme with a pending compile, activate it only after a successful build. The admin will warn you if the theme hasn't been compiled yet.

---

## Appearance settings

The **Appearance** tab lets you customize the look of any active theme without touching any code. Changes here apply site-wide across all themes.

### Accent color

The accent color is used for buttons, links, and interactive highlights. Click the color swatch to open a color picker, or type a hex value directly (e.g. `#4f46e5`).

Default: `#171717` (near-black)

### Fonts

Three font settings control your site's typography:

| Setting | What it controls |
|---------|-----------------|
| **Body font** | All paragraph text, captions, and UI copy |
| **Heading font** | H1–H6 headings throughout the site |
| **Heading weight** | Thickness of headings: Light (300), Regular (400), Semibold (600), Bold (700) |

Fonts are grouped by category in the dropdown:

- **Sans-serif** — System sans-serif, Inter, Plus Jakarta Sans, DM Sans, Lato, Open Sans, Nunito
- **Serif** — System serif, Source Serif 4, Merriweather, Lora, Libre Baskerville
- **Display serif** (headings only) — Playfair Display, DM Serif Display, Fraunces
- **Geometric** — Space Grotesk, Sora, Raleway
- **Monospace** (body only) — System monospace, JetBrains Mono, IBM Plex Mono

System fonts load instantly with no external request. Google Fonts (everything else) are loaded from Google's CDN.

### Logo

Upload or paste the URL of an image to show in the site header. Supported formats: JPEG, PNG, WebP, SVG. If no logo is set, the site title text is displayed instead.

Click **Change** to open the media picker, or paste a URL directly into the field.

### Footer text

Custom text shown in the site footer. Supports plain text. Leave blank to use the default footer.

---

## Theme variables

Each theme can expose its own set of customization options — theme variables. These appear in the **Theme variables** section below the theme card when a theme is selected.

The Default theme exposes:

| Variable | Type | Description |
|----------|------|-------------|
| Hero background color | Color | Background color of the blog index hero section |
| Hero text color | Color | Text color inside the hero section |
| Card border radius | Select | Corner roundness of post cards: None / Small / Medium / Large |
| Max content width | Select | Maximum width of content columns: 640 / 768 / 900 / 1024 px |
| Post excerpt lines | Number | Number of lines shown in post excerpts on the blog index |

Custom themes can define their own variables — see [Custom Themes](./custom-themes.md).

Changes to theme variables save immediately when you click **Save variables**.

---

## Custom CSS variables

The **Custom CSS variables** section at the bottom of the Appearance tab lets you inject arbitrary CSS custom properties into the site's root scope. This is a power-user escape hatch for fine-grained styling that isn't covered by theme variables.

Each entry is a key-value pair. Enter the variable name without the `--` prefix — it is added automatically.

**Example:**

| Variable name | Value |
|---------------|-------|
| `link-hover-color` | `#4f46e5` |
| `sidebar-width` | `280px` |

These become `--link-hover-color: #4f46e5` and `--sidebar-width: 280px` in your site's CSS, available for use in theme stylesheets.

Custom CSS variables are injected after theme variables, so they can override theme-defined values.

---

## Custom themes

You can create a custom theme based on any existing theme. Go to the **Themes** tab, click **New theme**, give it a name, and choose a base theme to copy from. The new theme starts as an identical copy of the base.

Custom themes are built from TypeScript/React source files. After making changes to the source files on disk, click **Compile** in the admin to rebuild the theme. Compilation errors (if any) are shown inline.

For a full guide to building custom themes, see [Custom Themes](./custom-themes.md).
