# Webhooks

Webhooks let external services react to changes inside Carbon — a post being published, a comment landing for moderation, a new media upload — without polling the API. When a subscribed event fires, Carbon sends a signed HTTP `POST` to a URL you choose.

This is the primary out-of-process extension surface. Combined with [API keys](./api-keys.md), webhooks are how you build search indexers, static-site rebuild triggers, Slack/Discord notifiers, external moderation pipelines, and anything else that needs to know "something changed."

---

## Getting there

In the admin sidebar, open **Settings → Webhooks**. The page lists every webhook you've registered, lets you create new ones, and shows recent delivery attempts.

---

## Registering a webhook

Click **New webhook**. You'll need:

| Field | Notes |
|-------|-------|
| **Name** | Free-text label, used only in the admin UI |
| **URL** | The HTTPS endpoint Carbon will `POST` to |
| **Events** | One or more events from the [catalog below](#event-catalog) |

When you save, Carbon generates a **shared secret** and shows it once. Copy it immediately — it's used to sign every payload sent to your endpoint, and you'll need it on the receiving end to verify signatures. Lost secrets cannot be recovered; you'd need to delete and recreate the webhook.

A webhook can be toggled inactive without deleting it. Inactive webhooks receive no events.

---

## Event catalog

Each event sends the affected record as `data`, except for `*.deleted` events which send `{ "id": "<uuid>" }` only.

| Event | When it fires | `data` shape |
|-------|---------------|--------------|
| `post.created` | A new post is created (any status) | post record |
| `post.published` | A post transitions to `published` (on create, update, or approval) | post record |
| `post.updated` | An existing post is edited | post record |
| `post.deleted` | A post is deleted | `{ id }` |
| `page.created` | A new page is created | page record |
| `page.published` | A page transitions to `published` | page record |
| `page.updated` | An existing page is edited | page record |
| `page.deleted` | A page is deleted | `{ id }` |
| `comment.created` | A comment is submitted (status starts `pending` unless auto-approved) | comment record |
| `comment.approved` | A comment is approved from moderation | comment record |
| `media.uploaded` | A file is uploaded to the media library | media record |
| `media.deleted` | A media item is deleted | `{ id }` |

Record shapes match the corresponding `/api/v1` resource (e.g. a `post` payload contains `id`, `title`, `slug`, `content`, `status`, `authorId`, `publishedAt`, etc. — see the schema in `packages/api/src/lib/db/schema.ts`).

> **Note on editorial workflow events.** The codebase also dispatches `post.submitted_review`, `post.approved`, and `post.rejected` when a post moves through review. These events fire internally but are **not currently subscribable** — they're missing from the event allowlist used by the registration endpoint. Track this in [the known gaps section](#known-gaps).

---

## Payload envelope

Every delivery is a `POST` with this body:

```json
{
  "event": "post.published",
  "timestamp": "2026-05-05T14:23:00.123Z",
  "data": { "id": "...", "title": "...", "slug": "...", "...": "..." }
}
```

And these headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `User-Agent` | `CarbonCMS-Webhook/1.0` |
| `X-Carbon-Signature` | `sha256=<hex digest>` |

---

## Verifying the signature

Carbon signs the **raw request body** with HMAC-SHA256 using your webhook's shared secret, hex-encodes the digest, and prefixes it with `sha256=`. Always verify the signature before trusting a payload — without it, anyone who learns your URL can forge events.

### Node.js (Express)

```js
import crypto from "node:crypto";
import express from "express";

const app = express();
const SECRET = process.env.CARBON_WEBHOOK_SECRET;

// IMPORTANT: get the raw body, not parsed JSON
app.post("/webhooks/carbon", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.header("x-carbon-signature") ?? "";
  const expected = "sha256=" + crypto.createHmac("sha256", SECRET).update(req.body).digest("hex");

  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) return res.status(401).send("invalid signature");

  const { event, data } = JSON.parse(req.body.toString("utf8"));
  // ... handle event
  res.status(200).send("ok");
});
```

### Python (Flask)

```python
import hmac
import hashlib
import os
from flask import Flask, request, abort

app = Flask(__name__)
SECRET = os.environ["CARBON_WEBHOOK_SECRET"].encode()

@app.post("/webhooks/carbon")
def carbon_webhook():
    signature = request.headers.get("X-Carbon-Signature", "")
    expected = "sha256=" + hmac.new(SECRET, request.data, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        abort(401)
    payload = request.get_json()
    # ... handle payload["event"], payload["data"]
    return "ok", 200
```

Use a constant-time comparison (`timingSafeEqual` / `hmac.compare_digest`) — a regular `===` leaks timing information that can be used to forge signatures.

---

## Delivery semantics

- **One attempt per event.** Carbon currently does not retry failed deliveries. If your endpoint returns a non-2xx status, times out, or is unreachable, the event is logged as `failed` and dropped.
- **10-second timeout.** If your handler doesn't respond within 10s, the request is aborted.
- **At-most-once.** Combined with no retries, treat events as best-effort notifications, not a durable queue. For workflows that must not miss events, fall back to polling `/api/v1` on a schedule and use webhooks as a low-latency hint.
- **Order is not guaranteed.** Multiple events may fire concurrently (e.g. `post.updated` and `post.published` for the same post on a publish action). Make handlers idempotent.
- **Async dispatch.** Webhook delivery runs in the background after the API request completes, so a slow or failing endpoint will not slow down or fail the originating CMS operation.

---

## Inspecting deliveries

For each webhook, the admin UI shows recent delivery attempts with:

- The event name
- HTTP response status (or empty if the request failed before getting a response)
- `delivered` or `failed`
- Timestamp of the attempt
- The full payload that was sent

This is useful for debugging integrations — if your handler isn't being hit, check here first to see whether Carbon attempted the delivery and what response it got.

---

## Test deliveries

From the webhook detail page, click **Send test**. Carbon will dispatch a synthetic event:

```json
{
  "event": "ping",
  "timestamp": "2026-05-05T14:23:00.123Z",
  "data": { "message": "This is a test delivery from Carbon CMS." }
}
```

Signed with the same secret and headers as a real event. Useful for verifying connectivity and signature handling without waiting for real content changes.

---

## Known gaps

These are limitations of the current implementation, listed here so integrators aren't surprised:

- **No retries on failure.** A flaky endpoint will lose events. Plan for this.
- **Three editorial events fire but cannot be subscribed to.** `post.submitted_review`, `post.approved`, and `post.rejected` are dispatched by the review workflow but missing from the registration allowlist.
- **Programmatic management is admin-only.** The `/api/v1/webhooks` endpoints accept only the internal admin proxy auth, not API keys. To register webhooks from an external tool today, you must use the admin UI. API-key access for webhook management is a planned enhancement.
- **No event filtering.** A subscription is "all events of type X" — you cannot, for example, subscribe only to `post.published` events for a specific category.
