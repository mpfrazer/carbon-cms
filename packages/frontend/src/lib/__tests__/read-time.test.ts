import { describe, it, expect } from "vitest";
import { estimateReadTime } from "../read-time";

describe("estimateReadTime", () => {
  it("returns 0 for empty string", () => {
    expect(estimateReadTime("")).toBe(0);
  });

  it("returns 0 for tags with no text", () => {
    expect(estimateReadTime("<p></p><br/>")).toBe(0);
  });

  it("returns 1 for a short snippet", () => {
    expect(estimateReadTime("<p>Hello world</p>")).toBe(1);
  });

  it("strips HTML tags before counting", () => {
    const html = "<h1>Title</h1><p>Body text here.</p>";
    expect(estimateReadTime(html)).toBe(1);
  });

  it("returns 1 for exactly 200 words", () => {
    const words = Array(200).fill("word").join(" ");
    expect(estimateReadTime(words)).toBe(1);
  });

  it("returns 2 for 201 words", () => {
    const words = Array(201).fill("word").join(" ");
    expect(estimateReadTime(words)).toBe(2);
  });

  it("returns 2 for 400 words", () => {
    const words = Array(400).fill("word").join(" ");
    expect(estimateReadTime(words)).toBe(2);
  });

  it("returns 3 for 401 words", () => {
    const words = Array(401).fill("word").join(" ");
    expect(estimateReadTime(words)).toBe(3);
  });

  it("handles plain text with no HTML", () => {
    const text = Array(200).fill("word").join(" ");
    expect(estimateReadTime(text)).toBe(1);
  });

  it("collapses multiple spaces/newlines correctly", () => {
    const html = "<p>one  two\n\nthree</p>";
    expect(estimateReadTime(html)).toBe(1);
  });
});
