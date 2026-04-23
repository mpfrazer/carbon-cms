import { describe, it, expect } from "vitest";
import { parsePagination } from "../api/response";

describe("parsePagination", () => {
  it("returns defaults when params are absent", () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("parses explicit page and pageSize", () => {
    const params = new URLSearchParams({ page: "3", pageSize: "10" });
    const result = parsePagination(params);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.offset).toBe(20);
  });

  it("clamps page to minimum of 1", () => {
    const params = new URLSearchParams({ page: "0" });
    expect(parsePagination(params).page).toBe(1);
  });

  it("clamps page to minimum of 1 for negative values", () => {
    const params = new URLSearchParams({ page: "-5" });
    expect(parsePagination(params).page).toBe(1);
  });

  it("clamps pageSize to maximum of 100", () => {
    const params = new URLSearchParams({ pageSize: "500" });
    expect(parsePagination(params).pageSize).toBe(100);
  });

  it("clamps pageSize to minimum of 1", () => {
    const params = new URLSearchParams({ pageSize: "0" });
    expect(parsePagination(params).pageSize).toBe(1);
  });

  it("computes correct offset for page 2", () => {
    const params = new URLSearchParams({ page: "2", pageSize: "15" });
    expect(parsePagination(params).offset).toBe(15);
  });

  it("handles non-numeric values gracefully", () => {
    const params = new URLSearchParams({ page: "abc", pageSize: "xyz" });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
