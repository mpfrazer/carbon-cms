import { describe, it, expect } from "vitest";
import { coerce } from "../book-review-editor";

describe("BookReviewEditor coerce", () => {
  it("returns sensible defaults for an empty input", () => {
    expect(coerce({})).toEqual({
      author: "",
      rating: 0,
      yearPublished: undefined,
      genre: undefined,
      pageCount: undefined,
      isbn: undefined,
      purchaseUrl: undefined,
    });
  });

  it("preserves known string fields", () => {
    expect(coerce({ author: "Le Guin", isbn: "9780441478125" })).toMatchObject({
      author: "Le Guin",
      isbn: "9780441478125",
    });
  });

  it("preserves numeric rating, pageCount, year", () => {
    expect(coerce({ rating: 4, pageCount: 320, yearPublished: 1974 })).toMatchObject({
      rating: 4,
      pageCount: 320,
      yearPublished: 1974,
    });
  });

  it("drops non-numeric values from numeric fields", () => {
    const out = coerce({ rating: "five" as unknown as number, pageCount: null as unknown as number });
    expect(out.rating).toBe(0);
    expect(out.pageCount).toBeUndefined();
  });

  it("drops non-string values from string fields", () => {
    const out = coerce({ author: 42 as unknown as string });
    expect(out.author).toBe("");
  });
});
