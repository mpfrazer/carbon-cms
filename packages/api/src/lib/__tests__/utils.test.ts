import { describe, it, expect } from "vitest";
import { slugify, stripHtml } from "../utils";

describe("slugify", () => {
  it("lowercases and trims input", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("My Blog Post")).toBe("my-blog-post");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(slugify("Hello   ---   World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World! (2024)")).toBe("hello-world-2024");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("Post 123")).toBe("post-123");
  });
});

describe("stripHtml", () => {
  it("removes simple tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
  });

  it("removes nested tags", () => {
    expect(stripHtml("<div><strong>Bold</strong> text</div>")).toBe("Bold text");
  });

  it("removes tags with attributes", () => {
    expect(stripHtml('<a href="https://example.com" class="link">Click me</a>')).toBe("Click me");
  });

  it("trims surrounding whitespace from the full result", () => {
    expect(stripHtml("  <p>Hello</p>  ")).toBe("Hello");
  });

  it("leaves plain text unchanged", () => {
    expect(stripHtml("Just plain text")).toBe("Just plain text");
  });

  it("strips script tags", () => {
    expect(stripHtml('<script>alert("xss")</script>Safe')).toBe('alert("xss")Safe');
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});
