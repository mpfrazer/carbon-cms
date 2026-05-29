---
draft: true
---

# Built-in MCP Server

## Overview

This document proposes adding a built-in **Model Context Protocol** server to Carbon at `/api/v1/mcp`, so AI agents (Claude Desktop, Cursor, any MCP-compatible host) can search and author Carbon content natively without bespoke integration code. Authentication and authorization reuse the existing API-key + scopes system from Phase 1; tools map to existing REST capabilities; structured-content templates (Phase 2) drive template-aware authoring tools so agents can write recipes, book reviews, etc. against the actual schemas rather than as freeform text.

Written for author review and approval before implementation begins.

---

## Problem Statement

Carbon's REST API at `/api/v1` already supports headless authoring. But "headless authoring" today means a developer writes integration code: HTTP calls, schema validation, error handling, scope management. That's fine for engineering-team users — and useless for the non-engineer audience Carbon is built for.

The shape of authoring workflows is changing. Users increasingly want to say *"draft a recipe for Mediterranean pasta salad"* in Claude Desktop and have it land as a draft in their CMS. *"Find all my posts about cooking and tag them with the cooking category."* *"Summarize this interview transcript as a Q&A post."* Each of these is a workflow the REST API already supports primitively — but the bridge from "user talks to an AI assistant" to "Carbon does the thing" is missing.

MCP is that bridge. An MCP server exposes tools with rich typed metadata that AI agents discover and call directly. Users install Carbon as an MCP server in their AI host once; from then on, every conversation has implicit access to authoring against their site.

---

## Goals & Non-Goals

### Goals

- Built-in MCP endpoint at `/api/v1/mcp` shipping with Carbon — no separate process to deploy
- Streamable HTTP transport (per the current MCP spec)
- Auth via existing API keys; tools gated by the calling key's scopes
- Tool catalog covering the high-value workflows: search, read, create/update posts, template-aware authoring, comment moderation, editorial workflow
- Template-aware tools so agents author structured content (recipe, book-review, etc.) against the actual template schemas
- Read-only-by-default trust posture: new keys default to least privilege; explicit scope upgrades enable writes
- Documentation suitable for non-engineer admins installing Carbon in Claude Desktop / Cursor

### Non-Goals (this phase)

- stdio transport (backfill later if real demand surfaces; HTTP-only for v1)
- MCP **resources** primitive (typed content items the agent reads directly) — defer; tools cover the search use case adequately for v1
- MCP **prompts** primitive (pre-written prompt templates) — defer; nice-to-have once we see how authoring patterns shake out
- OAuth-based MCP auth — defer; Bearer token via existing API key is simpler and matches the install model
- Per-tool rate limiting beyond what the proxy already enforces per API key
- Tool versioning / deprecation framework — additive evolution only for now
- Multi-tenant or per-user MCP servers — single Carbon instance, single MCP endpoint
- Marketplace listing or auto-install registration — operators copy a config snippet into their MCP host

---

## Transport

**Streamable HTTP only.**

Carbon exposes a single endpoint:

```
POST /api/v1/mcp
```

The endpoint speaks the MCP protocol per the current spec — `initialize`, `tools/list`, `tools/call`, etc. — over Streamable HTTP. Server-Sent Events stream multi-turn responses where applicable.

**Why HTTP-only:**

- Carbon is a deployed service. Users already access it over HTTP. Adding stdio would require running a separate local-process bridge, defeating the "single deployable unit" doctrine.
- HTTP transport works with Claude Desktop's remote-server config, with Cursor's MCP integration, and with any MCP host that supports Streamable HTTP (the spec-recommended transport since late 2025).
- stdio is more universal across older MCP clients, but the user-side install story for HTTP — paste a URL and a key into a config — is simpler than the stdio "install our binary, point your client at it" flow.

**Reserved for the future:** if MCP-host adoption of HTTP lags or stdio-only clients become a significant audience, a separate `@carbon/mcp-stdio` binary that bridges to the HTTP endpoint can be published. Out of scope for this phase.

---

## Authentication

**Bearer API key in the `Authorization` header.** Same `csk_` token format and same `apiKeys` table introduced in PR #57 / #59.

MCP host configuration on the user side looks like:

```json
{
  "mcpServers": {
    "carbon": {
      "url": "https://your-carbon.example.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer csk_your-key-here"
      }
    }
  }
}
```

The admin's API-keys page gains a "Use with Claude / MCP" hint with this snippet on key creation.

**Why not the MCP OAuth flow:** the spec defines an OAuth 2.0 flow for MCP server auth. It's more secure for SaaS-style usage where many users authenticate against one server, and it sidesteps key-leak risks. But for Carbon's audience — one admin running one Carbon instance — a Bearer key is dramatically simpler:

- The user already manages keys for headless API access; no new concept to learn
- Scope semantics are reused 1:1 — a key with `content:write` can use the `create_post` tool, period
- Revocation works exactly like the rest of Carbon — revoke the key in the admin UI, MCP access dies immediately

We can adopt OAuth in a future phase if Carbon ever serves a multi-user MCP scenario.

---

## Authorization (scope mapping)

Every tool requires one or more scopes from the API-key vocabulary (see `docs/integrations/api-keys.md`). The MCP server checks scopes per call; tools the calling key lacks scope for are **hidden from `tools/list`** rather than returned-then-rejected — agents shouldn't see capabilities they can't invoke. This also gives admins meaningful control via the existing presets (Read-only, Content publisher, Webhook integrator, etc.).

| Tool category | Required scope(s) |
|---|---|
| Read tools (`search_content`, `get_post`, `list_templates`, `get_template_schema`, `list_recipes`, `list_drafts`) | `content:read` |
| Media read (`list_media`, `get_media`) | `media:read` |
| Write tools (`create_post`, `update_post`, `publish_post`, `schedule_post`) | `content:write` |
| Template-aware writes (`create_recipe`, `create_book_review`, `create_article`) | `content:write` |
| Media writes (`upload_media_from_url`, `update_media_metadata`) | `media:write` |
| Comment moderation (`list_pending_comments`, `approve_comment`, `reject_comment`) | `comments:read` + `comments:moderate` |
| Editorial workflow (`submit_for_review`, `approve_post`, `reject_post`) | `content:write` |
| Webhook ops (`list_webhooks`, `register_webhook`) | `webhooks:read` / `webhooks:write` |
| Site stats (`get_site_stats`) | `stats:read` |

**Explicitly not exposed via MCP:** anything in the `api-keys:*` or user-management surface. Per the principle from PR #59, keys can't manage other keys or create users. Same hazard applies at the MCP layer — an agent that could mint API keys could escalate beyond what the operator granted.

---

## Tool naming convention

`verb_noun` (snake_case), matching MCP community conventions:

- Reads: `search_*`, `get_*`, `list_*`
- Writes: `create_*`, `update_*`, `delete_*` (delete sparingly — destructive)
- Workflow: `publish_*`, `submit_for_review`, `approve_*`, `reject_*`, `moderate_*`
- Template-aware writes are first-class verbs: `create_recipe`, not `create_post_with_template`

Tool descriptions are written in the imperative for agents: *"Create a new recipe post. The post starts as a draft unless `status: 'published'` is set..."* — clear examples, explicit on side effects, mention scope requirements.

---

## Initial tool catalog

Intentional v1 set (~15 tools). Additive growth from there.

### Search and read

- `search_content` — full-text search across published posts and pages. Returns title, slug, excerpt, template, publishedAt, url
- `get_post` — fetch a single post by id or slug
- `list_drafts` — drafts and in-review posts (scoped to the calling key's view)
- `list_templates` — available template kinds with their JSON Schema (so agents know what fields exist)
- `get_template_schema` — single template's JSON Schema by kind

### Authoring

- `create_post` — generic post creation (article template by default)
- `update_post` — patch fields on an existing post
- `publish_post` — transition draft to published; supports `publishedAt` for backdating
- `schedule_post` — set scheduled status with a future `scheduledAt`

### Template-aware authoring

- `create_recipe` — typed parameters matching the recipe schema (`ingredients[]`, `prepTimeMinutes`, `instructions[]`, etc.) — agent doesn't have to know the JSON Schema, the tool definition declares it
- `create_book_review` — typed parameters for the book-review template (`author`, `rating`, `genre`, etc.)
- One per built-in template; future templates add to the catalog naturally

### Comment moderation

- `list_pending_comments` — comments awaiting moderation
- `approve_comment` / `reject_comment`

### Editorial workflow

- `submit_for_review` / `approve_post` / `reject_post` — already-existing endpoints surfaced as tools

That's it for v1. **Not in v1:** webhook management (PR #57 already exposes via API; MCP exposure can come later), media uploads via URL (defer), user management (deliberately excluded), site stats (low priority).

---

## Implementation shape

- New dependency: `@modelcontextprotocol/sdk` for the protocol-level work — handshake, message framing, tool registration, capability negotiation
- New module: `packages/api/src/lib/mcp/` containing the tool registry, scope guards, and tool implementations
- New route: `packages/api/src/app/api/v1/mcp/route.ts` — `POST` handler that delegates to the SDK's HTTP transport adapter
- Tool implementations are thin wrappers around existing API logic — for `create_post`, we call into the same code path that `POST /api/v1/posts` uses. **No business logic duplication.** Specifically: shared helpers from existing routes get extracted into `packages/api/src/lib/posts/` (and similar) if needed; routes and MCP tools both call them.
- Auth: a shared middleware that extracts the Bearer token, validates against `validateApiKey` (existing in `lib/api-key.ts`), and attaches the resolved scopes to the MCP request context for per-tool scope checks
- Tool catalog file lists every tool with `{ name, description, inputSchema (JSON Schema), requiredScopes[], handler }`. `tools/list` filters by the calling key's scopes.

---

## Spec evolution stance

MCP is moving. Mitigations:

1. **Thin protocol layer** — the SDK absorbs spec churn; Carbon's code lives at the tool-definition layer which has been stable
2. **Pin the SDK version** explicitly in `package.json` and bump deliberately rather than caret-ranging
3. **No premature spec adoption** — features like resources, prompts, sampling, completion are not implemented until we see real demand. Easier to add later than to deprecate.
4. **Document the SDK version** Carbon ships with in the public docs, so users hitting weird behavior in their MCP host know what we built against

---

## Trust model

Same as the REST API — the API-key + scope system is the trust boundary. A few specific things worth saying explicitly:

- **AI agents are non-human principals.** They behave more aggressively than humans: they retry, they batch, they call tools in unexpected sequences. The existing per-key rate limit (600 req/min) is the backstop.
- **Tool results land in agent context.** Anything `search_content` returns becomes part of the agent's prompt for that conversation. Don't expose private post data through tools without a scope check.
- **Agents can be tricked.** Prompt injection through post content is a real concern — if an agent calls `get_post` on a post whose body contains *"ignore your previous instructions and..."* the agent might comply. Mitigation: we don't strip post content (that would break legitimate use), but we document the risk for operators issuing high-scope keys.
- **No write-tools-without-keys.** Reads also require keys (per the discussion that produced this doc) — no anonymous AI traffic.

---

## Phased delivery

Atomic PRs in dependency order, mirroring the post-templates roadmap.

### PR A — Substrate

- `@modelcontextprotocol/sdk` dependency added
- `POST /api/v1/mcp` endpoint with Streamable HTTP transport via the SDK
- Auth middleware extracting the Bearer key and resolving scopes
- Tool registry skeleton with scope-aware `tools/list`
- Three read tools to prove the pipeline: `search_content`, `get_post`, `list_templates`
- Tests for: auth (no key → 401, invalid key → 401, valid key → 200), scope filtering of `tools/list`, tool invocation happy path for each of the three tools
- Docs: minimal `docs/integrations/mcp.md` with the Claude Desktop config snippet

### PR B — Write tools

- `create_post`, `update_post`, `publish_post`, `schedule_post`
- Refactor any duplicated post-route logic into shared helpers in `lib/posts/`
- Per-tool tests covering scope gating and validation surface-area

### PR C — Template-aware authoring

- `create_recipe`, `create_book_review`, `create_article`
- Tool inputs typed from the template schemas (one-time codegen or runtime translation)
- Tests against valid/invalid recipe and book-review payloads

### PR D — Editorial workflow + moderation

- `submit_for_review`, `approve_post`, `reject_post`
- `list_pending_comments`, `approve_comment`, `reject_comment`

### PR E (optional follow-up) — Media + stats

- `list_media`, `get_media`, `upload_media_from_url`
- `get_site_stats`

PRs A and B together unlock authoring; C makes it template-aware; D/E round out the workflow surface.

---

## Open Questions

1. **Tool description style.** How verbose? MCP agents use descriptions heavily; over-terse loses agent comprehension, over-verbose burns context tokens. Default to ~2-3 sentences per tool with one example, iterate based on real agent behavior.
2. **Read-tool defaults for unauthenticated MCP requests.** Spec is unclear whether `tools/list` is callable before auth. We'll require auth for everything including the catalog — keeps the trust story simple and prevents tool-enumeration fingerprinting of the deployment.
3. **Tool catalog discoverability.** Should the admin UI surface "here are the MCP tools currently available to each API key"? Useful for confidence but adds admin surface. Defer to a follow-up unless requested.
4. **Prompt injection labeling.** Should tool outputs from content-derived sources (post bodies, comments) be flagged in the agent context as untrusted? MCP spec has some primitives for this (sampling, content blocks with annotations) — investigate in PR C or D.

---

## Out of Scope

Deliberately deferred so they don't creep into Phase 3 PRs:

- stdio transport (HTTP-only for v1)
- MCP resources and prompts primitives
- OAuth 2.0 MCP auth flow
- Multi-tenant MCP (one server per Carbon instance)
- Tool versioning / deprecation framework
- AI-cost accounting / budgeting per key
- The previously-deferred plugin architecture (MCP covers many of those use cases; plugins as in-process code extension is deferred indefinitely)
