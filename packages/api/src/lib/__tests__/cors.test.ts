import { describe, it, expect } from "vitest";
import { parseCorsOrigins, getCorsHeaders } from "@/lib/cors";

describe("parseCorsOrigins", () => {
  it("returns empty array for undefined", () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseCorsOrigins("")).toEqual([]);
  });

  it("parses a single origin", () => {
    expect(parseCorsOrigins("https://example.com")).toEqual(["https://example.com"]);
  });

  it("parses multiple comma-separated origins", () => {
    expect(parseCorsOrigins("https://a.com,https://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("trims whitespace around origins", () => {
    expect(parseCorsOrigins("https://a.com , https://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("filters out empty entries from extra commas", () => {
    expect(parseCorsOrigins("https://a.com,,https://b.com")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });
});

describe("getCorsHeaders", () => {
  const allowed = ["https://frontend.example.com", "https://admin.example.com"];

  it("returns empty object when origin is null", () => {
    expect(getCorsHeaders(null, allowed)).toEqual({});
  });

  it("returns empty object when allowedOrigins is empty", () => {
    expect(getCorsHeaders("https://frontend.example.com", [])).toEqual({});
  });

  it("returns empty object for an unlisted origin", () => {
    expect(getCorsHeaders("https://evil.com", allowed)).toEqual({});
  });

  it("returns CORS headers for an allowed origin", () => {
    const headers = getCorsHeaders("https://frontend.example.com", allowed);
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://frontend.example.com");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(headers["Access-Control-Allow-Methods"]).toContain("DELETE");
    expect(headers["Vary"]).toBe("Origin");
  });

  it("reflects the specific origin that matched", () => {
    const headers = getCorsHeaders("https://admin.example.com", allowed);
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://admin.example.com");
  });
});
