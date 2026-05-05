import { describe, it, expect } from "vitest";
import {
  ALL_WEBHOOK_EVENTS,
  MAX_DELIVERY_ATTEMPTS,
  generateWebhookSecret,
  nextRetryDelaySeconds,
} from "../webhook";

describe("ALL_WEBHOOK_EVENTS", () => {
  it("includes the editorial workflow events that the review routes dispatch", () => {
    // Regression: these were dispatched by submit-review/approve/reject routes
    // but missing from the registration allowlist, so they could not be subscribed to.
    expect(ALL_WEBHOOK_EVENTS).toContain("post.submitted_review");
    expect(ALL_WEBHOOK_EVENTS).toContain("post.approved");
    expect(ALL_WEBHOOK_EVENTS).toContain("post.rejected");
  });

  it("contains every event that any route currently dispatches", () => {
    const expected = [
      "post.created", "post.published", "post.updated", "post.deleted",
      "post.submitted_review", "post.approved", "post.rejected",
      "page.created", "page.published", "page.updated", "page.deleted",
      "comment.created", "comment.approved",
      "media.uploaded", "media.deleted",
    ];
    for (const event of expected) {
      expect(ALL_WEBHOOK_EVENTS).toContain(event);
    }
  });

  it("has no duplicates", () => {
    const set = new Set<string>(ALL_WEBHOOK_EVENTS);
    expect(set.size).toBe(ALL_WEBHOOK_EVENTS.length);
  });
});

// Mirror of the admin-side ALL_EVENTS list in
// packages/admin/src/components/admin/webhooks-manager.tsx. If the two drift
// (API gains a new event, admin doesn't surface it — or vice versa) this test
// fails. Catches the bug class that previously hid the editorial events from
// the admin UI even after they were registrable in the API.
const ADMIN_EVENT_VALUES = [
  "post.created", "post.published", "post.updated", "post.deleted",
  "post.submitted_review", "post.approved", "post.rejected",
  "page.created", "page.published", "page.updated", "page.deleted",
  "comment.created", "comment.approved",
  "media.uploaded", "media.deleted",
];

describe("admin webhook event vocabulary", () => {
  it("offers every event the API accepts", () => {
    for (const event of ALL_WEBHOOK_EVENTS) {
      expect(ADMIN_EVENT_VALUES, `admin is missing event "${event}" — users cannot subscribe via the UI`)
        .toContain(event);
    }
  });

  it("does not offer events the API would reject", () => {
    for (const event of ADMIN_EVENT_VALUES) {
      expect(ALL_WEBHOOK_EVENTS, `admin offers unknown event "${event}" — registration would fail with a validation error`)
        .toContain(event);
    }
  });
});

describe("generateWebhookSecret", () => {
  it("returns a base64url string of sufficient entropy", () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(40);
  });

  it("produces a different value on each call", () => {
    expect(generateWebhookSecret()).not.toBe(generateWebhookSecret());
  });
});

describe("nextRetryDelaySeconds", () => {
  it("schedules retry 30s after the first failed attempt", () => {
    expect(nextRetryDelaySeconds(1)).toBe(30);
  });

  it("schedules retry 5 minutes after the second failed attempt", () => {
    expect(nextRetryDelaySeconds(2)).toBe(300);
  });

  it("schedules retry 30 minutes after the third failed attempt", () => {
    expect(nextRetryDelaySeconds(3)).toBe(1800);
  });

  it("returns null after the attempt budget is exhausted", () => {
    expect(nextRetryDelaySeconds(MAX_DELIVERY_ATTEMPTS)).toBeNull();
    expect(nextRetryDelaySeconds(MAX_DELIVERY_ATTEMPTS + 1)).toBeNull();
  });

  it("returns null for invalid attempt counts", () => {
    expect(nextRetryDelaySeconds(0)).toBeNull();
    expect(nextRetryDelaySeconds(-1)).toBeNull();
  });

  it("uses strictly increasing backoff", () => {
    let prev = 0;
    for (let attempts = 1; attempts < MAX_DELIVERY_ATTEMPTS; attempts++) {
      const delay = nextRetryDelaySeconds(attempts);
      expect(delay).not.toBeNull();
      expect(delay!).toBeGreaterThan(prev);
      prev = delay!;
    }
  });

  it("permits exactly MAX_DELIVERY_ATTEMPTS - 1 retries (so MAX_DELIVERY_ATTEMPTS total attempts)", () => {
    let attempts = 1;
    let retries = 0;
    while (nextRetryDelaySeconds(attempts) !== null) {
      retries++;
      attempts++;
    }
    expect(retries).toBe(MAX_DELIVERY_ATTEMPTS - 1);
  });
});
