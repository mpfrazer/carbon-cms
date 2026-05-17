import { z } from "zod";
import type { FrontendTemplate, TemplateRenderProps } from "@/templates/registry";

/**
 * book-review — the Library theme's contributed template.
 *
 * Demonstrates the theme-contribution mechanism end-to-end. No custom
 * AdminEditor is shipped; the admin uses the auto-form (PR C1) against
 * the JSON Schema that the API persists at theme activation.
 */

const bookReviewSchema = z.object({
  author: z.string().min(1).describe("Author's full name"),
  rating: z.number().int().min(1).max(5).describe("1–5 star rating"),
  yearPublished: z.number().int().min(1).max(9999).optional(),
  genre: z
    .enum(["fiction", "non-fiction", "biography", "sci-fi", "fantasy", "mystery", "poetry", "essays", "other"])
    .optional(),
  pageCount: z.number().int().positive().optional(),
  isbn: z.string().optional(),
  purchaseUrl: z.url().optional(),
}).strict();

interface BookReviewData {
  author: string;
  rating: number;
  yearPublished?: number;
  genre?: string;
  pageCount?: number;
  isbn?: string;
  purchaseUrl?: string;
}

function isBookReviewData(value: unknown): value is BookReviewData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as BookReviewData).author === "string" &&
    typeof (value as BookReviewData).rating === "number"
  );
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span aria-label={`${filled} of 5 stars`} className="text-amber-500 not-prose">
      {"★".repeat(filled)}
      <span className="text-neutral-300">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function BookReviewRender({ post, data }: TemplateRenderProps) {
  if (!isBookReviewData(data)) {
    return (
      <div
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    );
  }

  return (
    <div className="book-review-template">
      <aside className="book-review-summary not-prose my-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Author</div>
          <div className="font-medium">{data.author}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Rating</div>
          <div className="font-medium"><Stars rating={data.rating} /></div>
        </div>
        {data.genre && (
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Genre</div>
            <div className="font-medium capitalize">{data.genre}</div>
          </div>
        )}
        {data.yearPublished && (
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Published</div>
            <div className="font-medium">{data.yearPublished}</div>
          </div>
        )}
        {data.pageCount && (
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Pages</div>
            <div className="font-medium">{data.pageCount}</div>
          </div>
        )}
        {data.isbn && (
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">ISBN</div>
            <div className="font-mono text-xs">{data.isbn}</div>
          </div>
        )}
      </aside>

      <div
        className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {data.purchaseUrl && (
        <p className="not-prose mt-6">
          <a
            href={data.purchaseUrl}
            rel="nofollow noopener"
            className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
          >
            Buy this book
          </a>
        </p>
      )}
    </div>
  );
}

function bookReviewJsonLd(post: TemplateRenderProps["post"], data: Record<string, unknown>) {
  if (!isBookReviewData(data)) return {};
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Book",
      name: post.title,
      author: { "@type": "Person", name: data.author },
      ...(data.isbn && { isbn: data.isbn }),
      ...(data.yearPublished && { datePublished: String(data.yearPublished) }),
      ...(data.genre && { genre: data.genre }),
      ...(data.pageCount && { numberOfPages: data.pageCount }),
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: data.rating,
      bestRating: 5,
      worstRating: 1,
    },
    ...(post.author && {
      author: { "@type": "Person", name: post.author.name },
    }),
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(post.excerpt && { reviewBody: post.excerpt }),
  };
}

export const bookReview: FrontendTemplate = {
  kind: "book-review",
  Render: BookReviewRender,
  jsonLd: bookReviewJsonLd,
};

/**
 * The theme's contributed templates. Read by the theme-provider at
 * activation time; each entry is registered locally for rendering and its
 * Zod schema is converted to JSON Schema and persisted to the API for
 * server-side validation of post writes.
 */
export const templates = [
  {
    kind: bookReview.kind,
    label: "Book review",
    description: "Book review post with author, rating, genre, and purchase link. Emits schema.org Review markup.",
    schema: bookReviewSchema,
    template: bookReview,
  },
];
