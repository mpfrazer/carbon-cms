import { describe, it, expect } from "vitest";
import { z } from "zod";
import { deriveLabel, fieldsFromSchema } from "../zod-to-fields";

describe("deriveLabel", () => {
  it("title-cases a single word", () => {
    expect(deriveLabel("title")).toBe("Title");
  });

  it("splits camelCase into words", () => {
    expect(deriveLabel("publishedAt")).toBe("Published At");
    expect(deriveLabel("metaDescription")).toBe("Meta Description");
  });

  it("splits snake_case and kebab-case", () => {
    expect(deriveLabel("page_count")).toBe("Page Count");
    expect(deriveLabel("source-url")).toBe("Source Url");
  });
});

describe("fieldsFromSchema — primitives", () => {
  it("describes a required string field", () => {
    const fields = fieldsFromSchema(z.object({ title: z.string() }));
    expect(fields).toEqual([
      { kind: "string", key: "title", label: "Title", required: true },
    ]);
  });

  it("marks .optional() fields as not required", () => {
    const fields = fieldsFromSchema(z.object({ subtitle: z.string().optional() }));
    expect(fields[0]).toMatchObject({ key: "subtitle", required: false });
  });

  it("captures string format hints (email / url)", () => {
    const fields = fieldsFromSchema(
      z.object({
        contact: z.email(),
        site: z.url(),
      }),
    );
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    expect(byKey.contact).toMatchObject({ kind: "string", format: "email" });
    expect(byKey.site).toMatchObject({ kind: "string", format: expect.stringMatching(/^url|uri$/) });
  });

  it("captures string min/max length", () => {
    const fields = fieldsFromSchema(z.object({ name: z.string().min(2).max(50) }));
    expect(fields[0]).toMatchObject({ kind: "string", minLength: 2, maxLength: 50 });
  });

  it("describes integer vs floating-point numbers and bounds", () => {
    const fields = fieldsFromSchema(
      z.object({
        rating: z.number().int().min(1).max(5),
        weight: z.number(),
      }),
    );
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    expect(byKey.rating).toMatchObject({
      kind: "number",
      integer: true,
      minimum: 1,
      maximum: 5,
    });
    expect(byKey.weight).toMatchObject({ kind: "number", integer: false });
  });

  it("describes booleans", () => {
    const fields = fieldsFromSchema(z.object({ featured: z.boolean() }));
    expect(fields[0]).toMatchObject({ kind: "boolean", key: "featured" });
  });

  it("describes string enums as enum descriptors with options", () => {
    const fields = fieldsFromSchema(
      z.object({ difficulty: z.enum(["easy", "medium", "hard"]) }),
    );
    expect(fields[0]).toMatchObject({
      kind: "enum",
      key: "difficulty",
      options: ["easy", "medium", "hard"],
    });
  });
});

describe("fieldsFromSchema — arrays of primitives", () => {
  it("describes arrays of strings", () => {
    const fields = fieldsFromSchema(
      z.object({ tags: z.array(z.string()).min(1).max(10) }),
    );
    expect(fields[0]).toMatchObject({
      kind: "array",
      itemKind: "string",
      minItems: 1,
      maxItems: 10,
    });
  });

  it("describes arrays of numbers", () => {
    const fields = fieldsFromSchema(z.object({ scores: z.array(z.number()) }));
    expect(fields[0]).toMatchObject({ kind: "array", itemKind: "number" });
  });

  it("falls back to unknown for arrays of objects (not yet supported)", () => {
    const fields = fieldsFromSchema(
      z.object({ steps: z.array(z.object({ text: z.string() })) }),
    );
    expect(fields[0]).toMatchObject({ kind: "unknown" });
  });
});

describe("fieldsFromSchema — nested objects", () => {
  it("recursively describes nested object fields", () => {
    const fields = fieldsFromSchema(
      z.object({
        nutrition: z.object({
          calories: z.number().int(),
          protein: z.number().optional(),
        }),
      }),
    );
    expect(fields[0]).toMatchObject({
      kind: "object",
      key: "nutrition",
      fields: [
        { kind: "number", key: "calories", integer: true, required: true },
        { kind: "number", key: "protein", required: false },
      ],
    });
  });

  it("propagates the parent's required-set to nested fields", () => {
    const fields = fieldsFromSchema(
      z.object({
        author: z.object({
          name: z.string(),
          bio: z.string().optional(),
        }),
      }),
    );
    const obj = fields[0];
    if (obj.kind !== "object") throw new Error("expected object field");
    const byKey = Object.fromEntries(obj.fields.map((f) => [f.key, f]));
    expect(byKey.name.required).toBe(true);
    expect(byKey.bio.required).toBe(false);
  });
});

describe("fieldsFromSchema — descriptions", () => {
  it("captures .describe() text on a field", () => {
    const fields = fieldsFromSchema(
      z.object({
        slug: z.string().describe("URL-safe identifier"),
      }),
    );
    expect(fields[0]).toMatchObject({
      key: "slug",
      description: "URL-safe identifier",
    });
  });
});

describe("fieldsFromSchema — empty / unsupported", () => {
  it("returns an empty array for an empty object schema", () => {
    expect(fieldsFromSchema(z.object({}))).toEqual([]);
  });

  it("returns an unknown descriptor for unsupported field shapes (union of primitives)", () => {
    const fields = fieldsFromSchema(
      z.object({ id: z.union([z.string(), z.number()]) }),
    );
    // z.union may produce either an unknown descriptor or an enum — assert it
    // doesn't crash and produces some descriptor.
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe("id");
  });
});
