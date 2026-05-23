import { describe, it, expect, beforeEach } from "vitest";
import { getThemeAdminEditors, clearThemeAdminEditorsCache } from "../theme-admin-editors";

beforeEach(() => {
  clearThemeAdminEditorsCache();
});

describe("getThemeAdminEditors", () => {
  it("returns the editor map for the Library theme (includes book-review)", async () => {
    const editors = await getThemeAdminEditors("library");
    expect(editors["book-review"]).toBeDefined();
    expect(typeof editors["book-review"]).toBe("function");
  });

  it("returns an empty map for unknown themes (silent — no throw)", async () => {
    const editors = await getThemeAdminEditors("does-not-exist");
    expect(editors).toEqual({});
  });

  it("caches results per process (second call returns the same promise/map)", async () => {
    const a = await getThemeAdminEditors("library");
    const b = await getThemeAdminEditors("library");
    expect(b).toBe(a);
  });
});
