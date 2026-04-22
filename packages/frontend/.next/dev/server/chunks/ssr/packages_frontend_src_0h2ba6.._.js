module.exports = [
"[project]/packages/frontend/src/lib/theme-provider.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getActiveTheme",
    ()=>getActiveTheme,
    "getThemeComponents",
    ()=>getThemeComponents
]);
// Cache the active theme name for SSR mode (short TTL avoids stale reads after activation)
let cachedTheme = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5_000;
async function getActiveTheme() {
    const renderMode = process.env.CARBON_RENDER_MODE ?? "ssr";
    // In CSR/static mode the theme is baked in at build time via ACTIVE_THEME env var
    if (renderMode === "csr") {
        return process.env.ACTIVE_THEME ?? "default";
    }
    // SSR: read from API with short-lived in-memory cache
    const now = Date.now();
    if (cachedTheme && now < cacheExpiry) return cachedTheme;
    try {
        const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
        const internalSecret = process.env.CARBON_INTERNAL_SECRET ?? "";
        const res = await fetch(`${apiUrl}/api/v1/settings?keys=activeTheme`, {
            headers: {
                "X-Carbon-Internal": internalSecret
            },
            next: {
                revalidate: 5
            }
        });
        if (res.ok) {
            const json = await res.json();
            cachedTheme = json.data?.activeTheme ?? "default";
            cacheExpiry = now + CACHE_TTL_MS;
            return cachedTheme;
        }
    } catch  {
    // fall through to default
    }
    return "default";
}
async function getThemeComponents() {
    const theme = await getActiveTheme();
    // Dynamic import so only the active theme is loaded at request time.
    // Next.js will bundle all candidate themes at build time in CSR mode,
    // but tree-shakes in SSR mode since the import is evaluated at runtime.
    try {
        const [layout, blogIndex, blogPost, page] = await Promise.all([
            __turbopack_context__.f({
                "../themes/default/layout": {
                    id: ()=>"[project]/packages/frontend/src/themes/default/layout.tsx [app-rsc] (ecmascript, async loader)",
                    module: ()=>__turbopack_context__.A("[project]/packages/frontend/src/themes/default/layout.tsx [app-rsc] (ecmascript, async loader)")
                }
            }).import(`../themes/${theme}/layout`),
            __turbopack_context__.f({
                "../themes/default/blog-index": {
                    id: ()=>"[project]/packages/frontend/src/themes/default/blog-index.tsx [app-rsc] (ecmascript, async loader)",
                    module: ()=>__turbopack_context__.A("[project]/packages/frontend/src/themes/default/blog-index.tsx [app-rsc] (ecmascript, async loader)")
                }
            }).import(`../themes/${theme}/blog-index`),
            __turbopack_context__.f({
                "../themes/default/blog-post": {
                    id: ()=>"[project]/packages/frontend/src/themes/default/blog-post.tsx [app-rsc] (ecmascript, async loader)",
                    module: ()=>__turbopack_context__.A("[project]/packages/frontend/src/themes/default/blog-post.tsx [app-rsc] (ecmascript, async loader)")
                }
            }).import(`../themes/${theme}/blog-post`),
            __turbopack_context__.f({
                "../themes/default/page": {
                    id: ()=>"[project]/packages/frontend/src/themes/default/page.tsx [app-rsc] (ecmascript, async loader)",
                    module: ()=>__turbopack_context__.A("[project]/packages/frontend/src/themes/default/page.tsx [app-rsc] (ecmascript, async loader)")
                }
            }).import(`../themes/${theme}/page`)
        ]);
        return {
            SiteLayout: layout.SiteLayout,
            BlogIndex: blogIndex.BlogIndex,
            BlogPost: blogPost.BlogPost,
            PageContent: page.PageContent
        };
    } catch  {
        // Fall back to default theme if the requested theme fails to load
        const [layout, blogIndex, blogPost, page] = await Promise.all([
            __turbopack_context__.A("[project]/packages/frontend/src/themes/default/layout.tsx [app-rsc] (ecmascript, async loader)"),
            __turbopack_context__.A("[project]/packages/frontend/src/themes/default/blog-index.tsx [app-rsc] (ecmascript, async loader)"),
            __turbopack_context__.A("[project]/packages/frontend/src/themes/default/blog-post.tsx [app-rsc] (ecmascript, async loader)"),
            __turbopack_context__.A("[project]/packages/frontend/src/themes/default/page.tsx [app-rsc] (ecmascript, async loader)")
        ]);
        return {
            SiteLayout: layout.SiteLayout,
            BlogIndex: blogIndex.BlogIndex,
            BlogPost: blogPost.BlogPost,
            PageContent: page.PageContent
        };
    }
}
}),
"[project]/packages/frontend/src/lib/api.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiFetch",
    ()=>apiFetch,
    "apiGet",
    ()=>apiGet
]);
const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
const internalSecret = process.env.CARBON_INTERNAL_SECRET ?? "";
async function apiFetch(path) {
    return fetch(`${apiUrl}${path}`, {
        headers: {
            "X-Carbon-Internal": internalSecret
        },
        cache: "no-store"
    });
}
async function apiGet(path) {
    const res = await apiFetch(path);
    if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
    return res.json();
}
}),
"[project]/packages/frontend/src/app/(frontend)/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FrontendLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$theme$2d$provider$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/frontend/src/lib/theme-provider.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/frontend/src/lib/api.ts [app-rsc] (ecmascript)");
;
;
;
async function FrontendLayout({ children }) {
    const [{ SiteLayout }, settings, navPages] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$theme$2d$provider$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getThemeComponents"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["apiGet"])("/api/v1/settings?keys=siteTitle"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["apiGet"])("/api/v1/pages?status=published&pageSize=50")
    ]);
    const siteTitle = settings.data?.siteTitle ?? "Carbon CMS";
    const pages = (navPages.data ?? []).filter((p)=>p.slug !== "home");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(SiteLayout, {
        siteTitle: siteTitle,
        navPages: pages,
        children: children
    }, void 0, false, {
        fileName: "[project]/packages/frontend/src/app/(frontend)/layout.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/packages/frontend/src/app/(frontend)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/packages/frontend/src/app/(frontend)/layout.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=packages_frontend_src_0h2ba6.._.js.map