import { describe, it, expect } from "vitest";
import { parseSearchMode, parseSearchInputMode, parseShowBlogLink } from "../site-settings";

describe("parseSearchMode", () => {
  it("returns 'none' for undefined", () => {
    expect(parseSearchMode(undefined)).toBe("none");
  });

  it("returns 'none' for null", () => {
    expect(parseSearchMode(null)).toBe("none");
  });

  it("returns 'none' for empty string", () => {
    expect(parseSearchMode("")).toBe("none");
  });

  it("returns 'none' for an unrecognised value", () => {
    expect(parseSearchMode("sidebar")).toBe("none");
  });

  it("returns 'header' for 'header'", () => {
    expect(parseSearchMode("header")).toBe("header");
  });

  it("returns 'page' for 'page'", () => {
    expect(parseSearchMode("page")).toBe("page");
  });
});

describe("parseSearchInputMode", () => {
  it("returns 'submit' for undefined", () => {
    expect(parseSearchInputMode(undefined)).toBe("submit");
  });

  it("returns 'submit' for null", () => {
    expect(parseSearchInputMode(null)).toBe("submit");
  });

  it("returns 'submit' for empty string", () => {
    expect(parseSearchInputMode("")).toBe("submit");
  });

  it("returns 'submit' for an unrecognised value", () => {
    expect(parseSearchInputMode("live")).toBe("submit");
  });

  it("returns 'instant' for 'instant'", () => {
    expect(parseSearchInputMode("instant")).toBe("instant");
  });

  it("returns 'submit' for 'submit'", () => {
    expect(parseSearchInputMode("submit")).toBe("submit");
  });
});

describe("parseShowBlogLink", () => {
  it("returns true for undefined", () => {
    expect(parseShowBlogLink(undefined)).toBe(true);
  });

  it("returns true for null", () => {
    expect(parseShowBlogLink(null)).toBe(true);
  });

  it("returns true for true", () => {
    expect(parseShowBlogLink(true)).toBe(true);
  });

  it("returns true for 'true'", () => {
    expect(parseShowBlogLink("true")).toBe(true);
  });

  it("returns false for false", () => {
    expect(parseShowBlogLink(false)).toBe(false);
  });

  it("returns false for 'false'", () => {
    expect(parseShowBlogLink("false")).toBe(false);
  });

  it("returns true for an unrecognised value", () => {
    expect(parseShowBlogLink("yes")).toBe(true);
  });
});
