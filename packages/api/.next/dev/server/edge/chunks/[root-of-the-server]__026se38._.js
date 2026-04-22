(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__026se38._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/ [middleware-edge] (unsupported edge import 'crypto', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`crypto`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'os', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`os`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'fs', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`fs`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'net', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`net`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'tls', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`tls`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'stream', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`stream`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'perf_hooks', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`perf_hooks`));
}),
"[project]/packages/api/src/lib/db/schema.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "categories",
    ()=>categories,
    "categoriesRelations",
    ()=>categoriesRelations,
    "commentStatusEnum",
    ()=>commentStatusEnum,
    "comments",
    ()=>comments,
    "commentsRelations",
    ()=>commentsRelations,
    "media",
    ()=>media,
    "mediaRelations",
    ()=>mediaRelations,
    "pageStatusEnum",
    ()=>pageStatusEnum,
    "pages",
    ()=>pages,
    "pagesRelations",
    ()=>pagesRelations,
    "postCategories",
    ()=>postCategories,
    "postCategoriesRelations",
    ()=>postCategoriesRelations,
    "postStatusEnum",
    ()=>postStatusEnum,
    "postTags",
    ()=>postTags,
    "postTagsRelations",
    ()=>postTagsRelations,
    "posts",
    ()=>posts,
    "postsRelations",
    ()=>postsRelations,
    "settings",
    ()=>settings,
    "tags",
    ()=>tags,
    "tagsRelations",
    ()=>tagsRelations,
    "userRoleEnum",
    ()=>userRoleEnum,
    "users",
    ()=>users,
    "usersRelations",
    ()=>usersRelations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/table.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/enum.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/text.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/timestamp.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/integer.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/uuid.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$primary$2d$keys$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/primary-keys.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/boolean.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/relations.js [middleware-edge] (ecmascript)");
;
;
const userRoleEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgEnum"])("user_role", [
    "admin",
    "editor",
    "author"
]);
const postStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgEnum"])("post_status", [
    "draft",
    "published",
    "scheduled",
    "archived"
]);
const pageStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgEnum"])("page_status", [
    "draft",
    "published"
]);
const commentStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgEnum"])("comment_status", [
    "pending",
    "approved",
    "spam",
    "trash"
]);
const users = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("users", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("email").notNull().unique(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    passwordHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("author"),
    avatarUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("avatar_url"),
    bio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("bio"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").notNull().defaultNow()
});
const media = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("media", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    filename: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("filename").notNull(),
    originalFilename: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("original_filename").notNull(),
    mimeType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("mime_type").notNull(),
    size: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["integer"])("size").notNull(),
    url: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("url").notNull(),
    altText: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("alt_text"),
    caption: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("caption"),
    uploadedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("uploaded_by").notNull().references(()=>users.id, {
        onDelete: "restrict"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow()
});
const categories = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("categories", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("description"),
    parentId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("parent_id"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow()
});
const tags = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("tags", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow()
});
const posts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("posts", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("title").notNull(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    content: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("content").notNull().default(""),
    excerpt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("excerpt"),
    status: postStatusEnum("status").notNull().default("draft"),
    authorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("author_id").notNull().references(()=>users.id, {
        onDelete: "restrict"
    }),
    featuredImageId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("featured_image_id").references(()=>media.id, {
        onDelete: "set null"
    }),
    publishedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("published_at"),
    scheduledAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("scheduled_at"),
    metaTitle: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("meta_title"),
    metaDescription: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("meta_description"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").notNull().defaultNow()
});
const pages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("pages", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("title").notNull(),
    slug: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("slug").notNull().unique(),
    content: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("content").notNull().default(""),
    status: pageStatusEnum("status").notNull().default("draft"),
    authorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("author_id").notNull().references(()=>users.id, {
        onDelete: "restrict"
    }),
    parentId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("parent_id"),
    featuredImageId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("featured_image_id").references(()=>media.id, {
        onDelete: "set null"
    }),
    menuOrder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["integer"])("menu_order").notNull().default(0),
    metaTitle: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("meta_title"),
    metaDescription: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("meta_description"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").notNull().defaultNow()
});
const postCategories = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("post_categories", {
    postId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("post_id").notNull().references(()=>posts.id, {
        onDelete: "cascade"
    }),
    categoryId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("category_id").notNull().references(()=>categories.id, {
        onDelete: "cascade"
    })
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$primary$2d$keys$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["primaryKey"])({
            columns: [
                t.postId,
                t.categoryId
            ]
        })
    ]);
const postTags = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("post_tags", {
    postId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("post_id").notNull().references(()=>posts.id, {
        onDelete: "cascade"
    }),
    tagId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("tag_id").notNull().references(()=>tags.id, {
        onDelete: "cascade"
    })
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$primary$2d$keys$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["primaryKey"])({
            columns: [
                t.postId,
                t.tagId
            ]
        })
    ]);
const comments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("comments", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("id").primaryKey().defaultRandom(),
    postId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("post_id").notNull().references(()=>posts.id, {
        onDelete: "cascade"
    }),
    authorName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("author_name").notNull(),
    authorEmail: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("author_email").notNull(),
    authorUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("author_url"),
    content: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("content").notNull(),
    status: commentStatusEnum("status").notNull().default("pending"),
    parentId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$uuid$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["uuid"])("parent_id"),
    ipAddress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("ip_address"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("created_at").notNull().defaultNow(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").notNull().defaultNow()
});
const settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["pgTable"])("settings", {
    key: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("key").primaryKey(),
    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["text"])("value").notNull(),
    autoload: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["boolean"])("autoload").notNull().default(true),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").notNull().defaultNow()
});
const usersRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(users, ({ many })=>({
        posts: many(posts),
        pages: many(pages),
        media: many(media)
    }));
const postsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(posts, ({ one, many })=>({
        author: one(users, {
            fields: [
                posts.authorId
            ],
            references: [
                users.id
            ]
        }),
        featuredImage: one(media, {
            fields: [
                posts.featuredImageId
            ],
            references: [
                media.id
            ]
        }),
        postCategories: many(postCategories),
        postTags: many(postTags),
        comments: many(comments)
    }));
const pagesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(pages, ({ one })=>({
        author: one(users, {
            fields: [
                pages.authorId
            ],
            references: [
                users.id
            ]
        }),
        featuredImage: one(media, {
            fields: [
                pages.featuredImageId
            ],
            references: [
                media.id
            ]
        })
    }));
const mediaRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(media, ({ one })=>({
        uploadedBy: one(users, {
            fields: [
                media.uploadedBy
            ],
            references: [
                users.id
            ]
        })
    }));
const categoriesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(categories, ({ many })=>({
        postCategories: many(postCategories)
    }));
const tagsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(tags, ({ many })=>({
        postTags: many(postTags)
    }));
const postCategoriesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(postCategories, ({ one })=>({
        post: one(posts, {
            fields: [
                postCategories.postId
            ],
            references: [
                posts.id
            ]
        }),
        category: one(categories, {
            fields: [
                postCategories.categoryId
            ],
            references: [
                categories.id
            ]
        })
    }));
const postTagsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(postTags, ({ one })=>({
        post: one(posts, {
            fields: [
                postTags.postId
            ],
            references: [
                posts.id
            ]
        }),
        tag: one(tags, {
            fields: [
                postTags.tagId
            ],
            references: [
                tags.id
            ]
        })
    }));
const commentsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["relations"])(comments, ({ one })=>({
        post: one(posts, {
            fields: [
                comments.postId
            ],
            references: [
                posts.id
            ]
        })
    }));
}),
"[project]/packages/api/src/lib/db/index.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$postgres$2d$js$2f$driver$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/postgres-js/driver.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$postgres$2f$src$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/postgres/src/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$schema$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/api/src/lib/db/schema.ts [middleware-edge] (ecmascript)");
;
;
;
// Uses the standard postgres.js driver — works with any Postgres provider.
// To switch from Neon to another provider (Supabase, Railway, self-hosted, etc.),
// just update DATABASE_URL in .env. No code changes required.
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
}
// Disable prefetch for serverless environments (Vercel, etc.)
const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$postgres$2f$src$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])(process.env.DATABASE_URL, {
    prepare: false
});
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$postgres$2d$js$2f$driver$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["drizzle"])(client, {
    schema: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$schema$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__
});
}),
"[project]/packages/api/src/lib/auth.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@auth/core/providers/credentials.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$index$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/api/src/lib/db/index.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$schema$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/api/src/lib/db/schema.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [middleware-edge] (ecmascript) <export * as z>");
;
;
;
;
;
;
;
const credentialsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email(),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const { handlers, signIn, signOut, auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])({
            credentials: {
                email: {
                    label: "Email",
                    type: "email"
                },
                password: {
                    label: "Password",
                    type: "password"
                }
            },
            async authorize (credentials) {
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) return null;
                const { email, password } = parsed.data;
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$index$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$schema$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["users"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$db$2f$schema$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["users"].email, email)).limit(1);
                if (!user[0]) return null;
                const passwordValid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"].compare(password, user[0].passwordHash);
                if (!passwordValid) return null;
                return {
                    id: user[0].id,
                    email: user[0].email,
                    name: user[0].name,
                    role: user[0].role
                };
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        jwt ({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        session ({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: "/admin/login"
    }
});
}),
"[project]/packages/api/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/api/src/lib/auth.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$api$2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["auth"])((req)=>{
    const { pathname } = req.nextUrl;
    const isApiRoute = pathname.startsWith("/api/v1");
    if (!isApiRoute) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // Credential validation endpoint is public (used by admin auth.js)
    if (pathname === "/api/v1/auth/login") return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // Trusted server-to-server calls from admin/frontend packages bypass JWT auth.
    const internalSecret = req.headers.get("x-carbon-internal");
    if (internalSecret && internalSecret === process.env.CARBON_INTERNAL_SECRET) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    if (!req.auth) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Unauthorized"
        }, {
            status: 401
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
});
const config = {
    matcher: [
        "/api/v1/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__026se38._.js.map