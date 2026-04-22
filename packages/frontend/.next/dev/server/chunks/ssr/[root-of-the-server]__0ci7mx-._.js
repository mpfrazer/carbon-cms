module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/packages/frontend/src/app/(frontend)/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HomePage,
    "generateMetadata",
    ()=>generateMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$theme$2d$provider$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/frontend/src/lib/theme-provider.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/frontend/src/lib/api.ts [app-rsc] (ecmascript)");
;
;
;
;
async function generateMetadata() {
    const [pageRes, settingsRes] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["apiGet"])("/api/v1/pages?status=published&pageSize=1"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["apiGet"])("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl")
    ]);
    const page = pageRes.data?.find((p)=>p.slug === "home");
    const s = settingsRes.data ?? {};
    const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
    return {
        title: s.siteTitle,
        description: page?.metaDescription ?? s.siteDescription,
        alternates: {
            canonical: base,
            types: {
                "application/rss+xml": `${base}/rss.xml`
            }
        },
        openGraph: {
            type: "website",
            url: base,
            title: page?.metaTitle ?? s.siteTitle,
            description: page?.metaDescription ?? s.siteDescription,
            siteName: s.siteTitle
        }
    };
}
async function HomePage() {
    const [{ PageContent }, settingsRes] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$theme$2d$provider$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getThemeComponents"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["apiGet"])("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl")
    ]);
    const s = settingsRes.data ?? {};
    const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
    const pagesRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["apiGet"])("/api/v1/pages?status=published&pageSize=50");
    const page = pagesRes.data?.find((p)=>p.slug === "home");
    if (!page) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: s.siteTitle,
        description: s.siteDescription,
        url: base,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${base}/blog?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
                type: "application/ld+json",
                dangerouslySetInnerHTML: {
                    __html: JSON.stringify(jsonLd)
                }
            }, void 0, false, {
                fileName: "[project]/packages/frontend/src/app/(frontend)/page.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PageContent, {
                title: page.title,
                content: page.content,
                updatedAt: new Date(page.updatedAt)
            }, void 0, false, {
                fileName: "[project]/packages/frontend/src/app/(frontend)/page.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/packages/frontend/src/app/(frontend)/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/packages/frontend/src/app/(frontend)/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ci7mx-._.js.map