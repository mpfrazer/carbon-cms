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

### Programmatic management with API keys

Webhooks can also be registered, edited, and revoked from outside the admin UI by calling the `/api/v1/webhooks` endpoints with an API key. The required scopes are:

| Operation | Scope |
|-----------|-------|
| List webhooks, view delivery history (`GET`) | `webhooks:read` |
| Create, update, delete, and send test deliveries (`POST` / `PUT` / `DELETE`) | `webhooks:write` |

Pick the **Webhook integrator** preset in the admin's API-keys page to get both scopes in one click. Pass the key as a bearer token:

```
Authorization: Bearer csk_<your-key>
```

A request with a valid API key but missing the required scope returns `403 Missing required scope: webhooks:write` (or `webhooks:read`).

---

## Event catalog

Each event sends the affected record as `data`, except for `*.deleted` events which send `{ "id": "<uuid>" }` only.

| Event | When it fires | `data` shape |
|-------|---------------|--------------|
| `post.created` | A new post is created (any status) | post record |
| `post.published` | A post transitions to `published` (on create, update, or approval) | post record |
| `post.updated` | An existing post is edited | post record |
| `post.deleted` | A post is deleted | `{ id }` |
| `post.submitted_review` | A draft post is submitted for editorial review | post record |
| `post.approved` | A post in review is approved (also fires `post.published`) | post record |
| `post.rejected` | A post in review is rejected back to the author | post record |
| `page.created` | A new page is created | page record |
| `page.published` | A page transitions to `published` | page record |
| `page.updated` | An existing page is edited | page record |
| `page.deleted` | A page is deleted | `{ id }` |
| `comment.created` | A comment is submitted (status starts `pending` unless auto-approved) | comment record |
| `comment.approved` | A comment is approved from moderation | comment record |
| `media.uploaded` | A file is uploaded to the media library | media record |
| `media.deleted` | A media item is deleted | `{ id }` |

Record shapes match the corresponding `/api/v1` resource (e.g. a `post` payload contains `id`, `title`, `slug`, `content`, `status`, `authorId`, `publishedAt`, etc. — see the schema in `packages/api/src/lib/db/schema.ts`).

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

- **Up to 4 attempts per event with exponential backoff.** A failed delivery is retried after 30 seconds, then 5 minutes, then 30 minutes. After the 4th failure the delivery is marked `failed` permanently and dropped. Retries are processed by a 1-minute cron, so the actual retry time may be up to a minute later than the schedule.
- **A failure is any non-2xx status, network error, or timeout.** The 10-second request timeout aborts handlers that don't respond in time.
- **At-least-once.** A retry can result in your handler receiving the same event more than once if a prior attempt succeeded but the response was lost in transit. **Make handlers idempotent** — typically by tracking the `(event, data.id)` pair you've already processed.
- **Order is not guaranteed.** Multiple events may fire concurrently (e.g. `post.updated` and `post.published` for the same post on a publish action), and a retried event can arrive after a later one. Don't rely on event ordering to reconstruct state.
- **Async dispatch.** Webhook delivery runs in the background after the API request completes, so a slow or failing endpoint will not slow down or fail the originating CMS operation.
- **Retries skip inactive webhooks.** If you toggle a webhook inactive while a retry is pending, the pending retry is dropped.

---

## Inspecting deliveries

For each webhook, the admin UI shows recent delivery attempts with:

- The event name
- HTTP response status of the most recent attempt (or empty if the request failed before getting a response)
- `delivered` or `failed`
- Number of attempts (1 for first-try success; higher values mean the delivery was retried)
- Timestamp of the most recent attempt
- The full payload that was sent

This is useful for debugging integrations — if your handler isn't being hit, check here first to see whether Carbon attempted the delivery and what response it got. A row with `failed` and `attempts: 4` means Carbon exhausted its retry budget; the event is gone.

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

- **No event filtering.** A subscription is "all events of type X" — you cannot, for example, subscribe only to `post.published` events for a specific category.
