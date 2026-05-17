import { describe, it, expect } from "vitest";
import { bookReview, templates } from "../templates";
import type { TemplatePost } from "@/templates";

const basePost: TemplatePost = {
  id: "post-1",
  title: "Parable of the Sower",
  slug: "parable-of-the-sower",
  content: "<p>A reread.</p>",
  excerpt: "A reread.",
  publishedAt: "2026-05-10T12:00:00.000Z",
  createdAt: "2026-05-09T12:00:00.000Z",
  updatedAt: "2026-05-10T12:00:00.000Z",
  template: "book-review",
  structuredData: {},
  author: { name: "Mike Frazer", avatarUrl: null },
  featuredImage: null,
};

const validReview = {
  author: "Octavia E. Butler",
  rating: 5,
  genre: "sci-fi",
  yearPublished: 1993,
  pageCount: 299,
  isbn: "9780446675505",
  purchaseUrl: "https://example.com/parable",
};

describe("bookReview template", () => {
  it("registers under kind 'book-review' with a Render component", () => {
    expect(bookReview.kind).toBe("book-review");
    expect(typeof bookReview.Render).toBe("function");
  });

  it("is exported in the library theme's templates array", () => {
    expect(templates).toHaveLength(1);
    expect(templates[0].kind).toBe("book-review");
    expect(templates[0].template).toBe(bookReview);
  });
});

describe("bookReview.jsonLd", () => {
  it("produces a schema.org Review with itemReviewed as a Book", () => {
    const out = bookReview.jsonLd!(basePost, validReview);
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@type"]).toBe("Review");
    expect(out.itemReviewed).toMatchObject({
      "@type": "Book",
      name: "Parable of the Sower",
      author: { "@type": "Person", name: "Octavia E. Butler" },
    });
  });

  it("carries optional book metadata (ISBN, year, genre, pages) when present", () => {
    const out = bookReview.jsonLd!(basePost, validReview);
    const item = out.itemReviewed as Record<string, unknown>;
    expect(item.isbn).toBe("9780446675505");
    expect(item.datePublished).toBe("1993");
    expect(item.genre).toBe("sci-fi");
    expect(item.numberOfPages).toBe(299);
  });

  it("emits a Rating block with 1–5 scale", () => {
    const out = bookReview.jsonLd!(basePost, validReview);
    expect(out.reviewRating).toEqual({
      "@type": "Rating",
      ratingValue: 5,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it("includes review author from post.author when present", () => {
    const out = bookReview.jsonLd!(basePost, validReview);
    expect(out.author).toEqual({ "@type": "Person", name: "Mike Frazer" });
  });

  it("omits optional itemReviewed fields when not provided", () => {
    const minimal = { author: "Anonymous", rating: 3 };
    const out = bookReview.jsonLd!(basePost, minimal);
    const item = out.itemReviewed as Record<string, unknown>;
    expect(item.isbn).toBeUndefined();
    expect(item.genre).toBeUndefined();
    expect(item.datePublished).toBeUndefined();
    expect(item.numberOfPages).toBeUndefined();
  });

  it("returns an empty object for non-book-review data (defensive)", () => {
    expect(bookReview.jsonLd!(basePost, { rating: "five" })).toEqual({});
  });
});
