import { describe, it, expect } from "vitest";
import { ALL_WEBHOOK_EVENTS, generateWebhookSecret } from "../webhook";

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
