# MCP Server

Carbon ships a built-in [Model Context Protocol](https://modelcontextprotocol.io) server at `/api/v1/mcp` so AI agents — Claude Desktop, Cursor, or anything that speaks MCP — can search and (in future phases) author Carbon content natively, without writing any integration code.

This page covers the v1 read-only release. Authoring tools land in subsequent PRs (`create_post`, template-aware `create_recipe` / `create_book_review`, etc.) — see [`docs/architecture/mcp-server.md`](../architecture/mcp-server.md) for the full roadmap.

---

## What you can do today

With a Carbon API key, an AI agent can:

- **`search_content`** — full-text search across published posts; returns title, slug, excerpt, template, publish date
- **`get_post`** — fetch a single post by ID or slug, including its template, structured data, categories, tags, and featured image
- **`list_templates`** — discover what post templates exist on the site (article, recipe, plus anything the active theme contributes), optionally with their JSON Schemas

That's enough for an agent to discover content, summarize it, reference it in conversation, and build context about your site. Authoring tools come next.

---

## Setting it up

### 1. Create an API key

In the admin sidebar, open **Settings → API keys**. Click **Create new key** and pick the **Read-only** preset (or any preset that includes `content:read`). Copy the key — it's shown once.

The v1 read tools only need `content:read`. Future write tools will require `content:write`, moderation tools will require `comments:moderate`, etc. Scopes determine which tools the agent sees in its `tools/list` response — narrower keys are safer.

### 2. Wire it up in your MCP host

For **Claude Desktop**, add this to your config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%/Claude/claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "carbon": {
      "url": "https://your-carbon-host/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer csk_your-key-here"
      }
    }
  }
}
```

For **Cursor** and other MCP-capable hosts, follow their docs for adding a remote HTTP MCP server — the URL and `Authorization` header are the same.

Restart the MCP host. Carbon's tools appear in the agent's available toolset.

### 3. Try it

Ask the agent something like:

- *"Search my Carbon site for posts about sourdough."*
- *"What templates are available on the site?"*
- *"Show me the full content of the post with slug `my-first-recipe`."*

The agent should call the appropriate tool, return formatted JSON, and reason over it.

---

## How auth works

Every MCP request must carry a Bearer API key. No-key and invalid-key requests get `401`. There is no anonymous access — even read tools require a key, so the operator always controls who can hit the server.

The MCP `tools/list` response is **filtered by the calling key's scopes**: the agent only sees tools it can actually invoke. A `webhooks:write`-only key sees no tools at all (until webhook-management tools land in a later PR); a `content:read`-only key sees the three read tools above.

Rate limiting is enforced per-key by the same proxy that protects the REST API — 600 requests per minute. Plenty of headroom for normal agent usage; brute-force tool calls hit `429`.

---

## Transport and protocol

- **HTTP only** (Streamable HTTP per the MCP spec). No stdio support in v1; if real demand surfaces, a `@carbon/mcp-stdio` bridge binary can come later
- **Stateless mode** — no session IDs, no server-side conversation state. Every request is independent. Auth is per-request via the Bearer key.
- **JSON responses, not SSE** — read tools today return small JSON payloads. Streaming responses can come later for tools that need it (e.g. multi-step authoring with progress).

---

## Tool catalog (v1)

| Tool | Scopes | What it does |
|---|---|---|
| `list_templates` | `content:read` | Lists every post template (built-ins + active theme contributions); optionally includes each one's JSON Schema |
| `get_post` | `content:read` | Fetches a single post by ID or slug, with template, structured data, categories, tags, and featured image |
| `search_content` | `content:read` | Full-text search across published posts; returns minimal records, call `get_post` for full body |

Tool descriptions visible to agents are written in the imperative with examples; agents read them to figure out when and how to call.

---

## Security guidance

- **Never commit API keys.** Same as the REST API: treat keys like database passwords. Use your MCP host's secret-management facility (Claude Desktop reads from the config file; protect it accordingly).
- **One key per AI host.** If you use Claude Desktop and Cursor separately, give each its own key with its own scope set. Revoking one doesn't break the other.
- **Prefer narrow scopes.** A read-only key can't do anything destructive even if it leaks. A `content:write` key can publish posts on your behalf.
- **AI behavior is non-human.** Agents retry, batch, and chain tool calls in unexpected sequences. Watch the per-key rate-limit headers if you suspect a runaway agent; revoke the key in the admin to kill access immediately.
- **Prompt injection is a real concern.** If a post's body contains *"ignore your previous instructions and..."* an agent that calls `get_post` on it might comply. We don't strip content (would break legitimate use), but you should be aware when issuing high-scope keys.

---

## Roadmap (out of scope for v1)

These land in subsequent PRs. See the architecture doc for the full plan:

- **Generic authoring** — `create_post`, `update_post`, `publish_post`, `schedule_post` (`content:write`)
- **Template-aware authoring** — `create_recipe`, `create_book_review`, `create_article` with typed parameters matching each template's schema
- **Editorial workflow** — `submit_for_review`, `approve_post`, `reject_post`
- **Comment moderation** — `list_pending_comments`, `approve_comment`, `reject_comment`
- **Media + stats** — `list_media`, `upload_media_from_url`, `get_site_stats`

Each ships as its own atomic PR. Existing keys gain access automatically as their scopes match new tools' requirements; no key reissue needed.

---

## Known gaps

- **No stdio transport.** HTTP-only for v1. Most modern MCP hosts support HTTP; stdio-only clients are unsupported until/unless a bridge is built.
- **No OAuth.** Authentication is Bearer-key only; the MCP OAuth flow is deferred to a future phase when Carbon serves a real multi-tenant MCP scenario.
- **No MCP resources or prompts.** Tools cover the v1 surface adequately; the `resources` and `prompts` primitives are deferred.
- **No prompt-injection labeling.** Tool outputs include post content verbatim; future work may annotate untrusted-source content per the MCP spec's content-annotation primitives.
