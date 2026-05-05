# API Keys

API keys let external services call the Carbon API on behalf of an admin without holding a session. They're the standard way to authenticate headless consumers — static-site rebuilders, search indexers, content migration tools, external moderation services, [webhook integrators](./webhooks.md), and anything else that needs programmatic access.

Each key carries a set of **scopes** that decide what the holder can do. Pick the narrowest scope set that meets the use case — a key with `webhooks:write` and nothing else is much less dangerous if it leaks than a key that can publish posts and edit users.

---

## Getting there

In the admin sidebar, open **Settings → API keys**.

---

## Creating a key

Click **Create new key**. You'll need:

| Field | Notes |
|-------|-------|
| **Name** | Free-text label that identifies the consumer (e.g. "Personal brand site rebuild trigger"). Used only in the admin UI |
| **Scopes** | A preset bundle from the dropdown, or **Custom** for individual scopes |

When you save, Carbon generates the key and shows it **once**. Copy it immediately — it's never shown again. If you lose it, revoke and re-create.

A key looks like:
```
csk_aB3kL9mN-pQr_2sTuVwXyZa1bC4dEfGhI5jKlMnOp6q
```

The `csk_` prefix is intentional — it lets the API recognize and validate API-key bearers separately from session tokens, and makes the key easy to grep for in code reviews and secret scanners.

---

## Scopes

Carbon scopes follow a `<resource>:<action>` convention. The full vocabulary:

| Scope | Grants |
|-------|--------|
| `content:read` | Read posts, pages, categories, tags, and revisions via `GET` |
| `content:write` | Create, update, delete, publish, schedule, and manage editorial review on posts, pages, categories, tags |
| `media:read` | List the media library and fetch metadata |
| `media:write` | Upload, edit, and delete media |
| `comments:read` | List all comments including the pending-moderation queue |
| `comments:moderate` | Approve, reject, edit, and delete comments |
| `settings:read` | Read site settings |
| `settings:write` | Update site settings, including the test-email and test-storage-path utilities |
| `themes:read` | List installed themes and read their config / variables |
| `themes:write` | Install, compile, activate, and configure themes |
| `users:read` | List users (admin view) |
| `users:write` | Create, edit, suspend, and delete users |
| `webhooks:read` | List webhooks and view delivery history |
| `webhooks:write` | Register, edit, delete, and send test deliveries |
| `stats:read` | Read the site stats endpoint |

**Intentionally not available as scopes:**
- **API key management itself.** Keys cannot create or revoke other keys — that's a privilege-escalation hazard. Manage keys through the admin UI only.
- **Auth, setup, cron, search, health.** These endpoints are either public, internal, or trivially gated; there's nothing meaningful to scope.
- **AI endpoints.** Currently the AI features are admin-only. Scoping is deferred until the cost-and-policy story is settled.

### Read vs. write

Read and write are split for every resource. A static-site generator subscribed to `content:read` cannot inadvertently delete posts; an external moderation tool with `comments:moderate` can't read or write content. If you need both, grant both — the system never infers one from the other.

---

## Presets

The dropdown offers four common bundles plus **Custom**:

| Preset | Scopes | Typical consumer |
|--------|--------|------------------|
| **Read-only** | All `*:read` scopes | Static-site rebuilders, search indexers, analytics dashboards |
| **Content publisher** | `content:read`, `content:write`, `media:read`, `media:write` | Migration tools, headless publishers, AI authoring tools |
| **Moderator** | `comments:read`, `comments:moderate` | External moderation services |
| **Webhook integrator** | `webhooks:read`, `webhooks:write` | Programmatic webhook subscription management |
| **Custom** | (you choose) | Any other case |

Picking a preset shows the scopes it grants inline so you see exactly what you're handing out. Switching to **Custom** prefills the checkbox grid with whatever preset was selected before, so it feels like a tweak rather than a reset.

There is intentionally no "Full access" preset. If a key needs every scope, select them deliberately.

---

## Using a key

Pass the key in the `Authorization` header on every request to the Carbon API:

```
Authorization: Bearer csk_<your-key>
```

### curl

```bash
curl -H "Authorization: Bearer $CARBON_API_KEY" \
     https://your-carbon-host/api/v1/posts
```

### Node.js

```js
const res = await fetch("https://your-carbon-host/api/v1/posts", {
  headers: { Authorization: `Bearer ${process.env.CARBON_API_KEY}` },
});
```

### Python

```python
import os
import requests

res = requests.get(
    "https://your-carbon-host/api/v1/posts",
    headers={"Authorization": f"Bearer {os.environ['CARBON_API_KEY']}"},
)
```

---

## What the API returns

| Status | Meaning |
|--------|---------|
| `2xx` | Authorized and succeeded |
| `401 Unauthorized` | No bearer or the bearer is not a valid `csk_` token |
| `401 Invalid API key` | The bearer looked like an API key (`csk_...`) but does not exist or has been revoked |
| `403 Missing required scope: <scope>` | The key is valid but does not hold the scope this endpoint requires |

For any scope-protected endpoint, the response body on `403` names the specific scope you'd need to add to the key.

---

## Rate limits

API-key requests get a higher rate limit than anonymous IP traffic — currently **600 requests per minute per key**. Anonymous (or spoofed/invalid) requests fall back to **120 per minute per IP**.

Limit headers come back on every response:

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 597
X-RateLimit-Reset: 1746478920
```

When you exceed the limit you get a `429 Too many requests` with a `Retry-After` header.

---

## Revoking a key

In the admin's **API keys** page, click the trash icon next to any key. Revocation is immediate and irreversible — every subsequent request bearing that key returns `401 Invalid API key`. There is no "un-revoke."

If a key is leaked, revoke it first and ask questions later. There is no rate-limited grace period.

---

## Security guidance

- **Never commit keys to source control.** Treat them like database passwords. Use environment variables, a secret manager, or your platform's equivalent (Vercel env vars, Railway secrets, etc.).
- **One key per consumer.** If three different services need API access, give each its own key with its own scope set. When one needs to be rotated or revoked, the others are unaffected.
- **Prefer narrow scopes.** A key with `content:read` cannot do anything destructive even if it leaks. A key with `users:write` can change passwords. Match the grant to the actual need.
- **Rotate periodically.** For long-running production integrations, rotate keys on a schedule (quarterly is common). Create the new key, deploy it, then revoke the old one.
- **Scan for leaked keys.** The `csk_` prefix is greppable. Run a periodic check across your repos and logs for the prefix.

---

## Known gaps

These are limitations integrators should be aware of:

- **No "edit scopes" UI.** Once a key is created, its scopes are fixed. To change them, revoke the key and create a new one with the updated scopes. Planned, not yet implemented.
- **No expiry.** Keys live until revoked. No automatic rotation or time-bound keys yet.
- **No per-resource scoping.** Scopes are coarse: `content:write` grants write access to all posts and pages, not "posts in category X." Fine-grained authorization is not on the near-term roadmap.
- **No usage analytics beyond `lastUsedAt`.** The list view shows when each key was last used; there's no per-endpoint or per-period breakdown yet.
