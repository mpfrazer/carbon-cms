import { describe, it, expect } from "vitest";
import { canSubmitForReview, canApprove, canReject } from "../workflow";

describe("canSubmitForReview", () => {
  it("allows draft posts", () => expect(canSubmitForReview("draft")).toBe(true));
  it("blocks already in_review", () => expect(canSubmitForReview("in_review")).toBe(false));
  it("blocks published", () => expect(canSubmitForReview("published")).toBe(false));
  it("blocks scheduled", () => expect(canSubmitForReview("scheduled")).toBe(false));
  it("blocks archived", () => expect(canSubmitForReview("archived")).toBe(false));
});

describe("canApprove", () => {
  it("allows in_review posts", () => expect(canApprove("in_review")).toBe(true));
  it("blocks draft", () => expect(canApprove("draft")).toBe(false));
  it("blocks published", () => expect(canApprove("published")).toBe(false));
  it("blocks scheduled", () => expect(canApprove("scheduled")).toBe(false));
  it("blocks archived", () => expect(canApprove("archived")).toBe(false));
});

describe("canReject", () => {
  it("allows in_review posts", () => expect(canReject("in_review")).toBe(true));
  it("blocks draft", () => expect(canReject("draft")).toBe(false));
  it("blocks published", () => expect(canReject("published")).toBe(false));
  it("blocks scheduled", () => expect(canReject("scheduled")).toBe(false));
  it("blocks archived", () => expect(canReject("archived")).toBe(false));
});
