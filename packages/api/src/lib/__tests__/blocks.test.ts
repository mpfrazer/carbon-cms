import { describe, it, expect } from "vitest";
import { parseBlocks, serializeBlocksToContent } from "../blocks";
import type { PageBlock } from "../blocks";

describe("parseBlocks", () => {
  it("returns null for null input", () => expect(parseBlocks(null)).toBeNull());
  it("returns null for empty string", () => expect(parseBlocks("")).toBeNull());
  it("returns null for invalid JSON", () => expect(parseBlocks("{bad}")).toBeNull());
  it("returns null when JSON is not an array", () => expect(parseBlocks('{"type":"text"}')).toBeNull());
  it("parses a valid blocks array", () => {
    const blocks: PageBlock[] = [{ type: "text", content: "<p>Hello</p>" }];
    expect(parseBlocks(JSON.stringify(blocks))).toEqual(blocks);
  });
  it("returns an empty array for []", () => expect(parseBlocks("[]")).toEqual([]));
});

describe("serializeBlocksToContent", () => {
  it("returns the first text block content", () => {
    const blocks: PageBlock[] = [
      { type: "text", content: "<p>First</p>" },
      { type: "text", content: "<p>Second</p>" },
    ];
    expect(serializeBlocksToContent(blocks)).toBe("<p>First</p>");
  });

  it("falls back to hero heading when no text block", () => {
    const blocks: PageBlock[] = [
      { type: "hero", heading: "Welcome" },
    ];
    expect(serializeBlocksToContent(blocks)).toBe("<h1>Welcome</h1>");
  });

  it("falls back to columns content when no text or hero", () => {
    const blocks: PageBlock[] = [
      { type: "columns", columns: [{ content: "<p>Col 1</p>" }, { content: "<p>Col 2</p>" }] },
    ];
    expect(serializeBlocksToContent(blocks)).toContain("<p>Col 1</p>");
  });

  it("returns empty string for blocks with no usable content", () => {
    const blocks: PageBlock[] = [
      { type: "image", url: "https://example.com/img.jpg" },
      { type: "cta", heading: "Join us", buttonText: "Sign up", buttonUrl: "/register" },
    ];
    expect(serializeBlocksToContent(blocks)).toBe("");
  });

  it("prefers text block over hero even when hero comes first", () => {
    const blocks: PageBlock[] = [
      { type: "hero", heading: "Hero heading" },
      { type: "text", content: "<p>Body text</p>" },
    ];
    expect(serializeBlocksToContent(blocks)).toBe("<p>Body text</p>");
  });
});
