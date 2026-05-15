import type { FrontendTemplate, TemplateRenderProps } from "./registry";

interface InstructionStep {
  step: string;
  imageUrl?: string;
}

interface RecipeData {
  panelPlacement?: "top" | "bottom";
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: string[];
  instructions: InstructionStep[];
  cuisine?: string;
  course?: string;
  difficulty?: "easy" | "medium" | "hard";
  sourceUrl?: string;
}

function isRecipeData(value: unknown): value is RecipeData {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as RecipeData).ingredients) &&
    Array.isArray((value as RecipeData).instructions)
  );
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function isoDuration(minutes: number): string {
  return `PT${Math.max(0, Math.floor(minutes))}M`;
}

function RecipeSummary({ data }: { data: RecipeData }) {
  const total = data.prepTimeMinutes + data.cookTimeMinutes;
  return (
    <aside className="recipe-summary not-prose my-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Prep</div>
        <div className="font-medium">{formatDuration(data.prepTimeMinutes)}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Cook</div>
        <div className="font-medium">{formatDuration(data.cookTimeMinutes)}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Total</div>
        <div className="font-medium">{formatDuration(total)}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Yield</div>
        <div className="font-medium">{data.servings} {data.servings === 1 ? "serving" : "servings"}</div>
      </div>
    </aside>
  );
}

function RecipePanel({ data }: { data: RecipeData }) {
  return (
    <section className="recipe-panel not-prose my-8 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-3">Ingredients</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-neutral-800">
          {data.ingredients.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-3">Instructions</h2>
        <ol className="space-y-4">
          {data.instructions.map((instr, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold">
                {i + 1}
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-neutral-800">{instr.step}</p>
                {instr.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={instr.imageUrl} alt="" className="rounded-md max-w-md w-full object-cover" />
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {(data.cuisine || data.course || data.difficulty || data.sourceUrl) && (
        <footer className="text-xs text-neutral-500 border-t border-neutral-200 pt-4 flex flex-wrap gap-x-4 gap-y-1">
          {data.cuisine && <span>Cuisine: <span className="text-neutral-700">{data.cuisine}</span></span>}
          {data.course && <span>Course: <span className="text-neutral-700">{data.course}</span></span>}
          {data.difficulty && <span>Difficulty: <span className="text-neutral-700">{data.difficulty}</span></span>}
          {data.sourceUrl && (
            <span>
              Source: <a href={data.sourceUrl} className="text-neutral-700 underline" rel="nofollow noopener">{new URL(data.sourceUrl).hostname}</a>
            </span>
          )}
        </footer>
      )}
    </section>
  );
}

function RecipeBody({ post }: { post: TemplateRenderProps["post"] }) {
  return (
    <div
      className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
      dangerouslySetInnerHTML={{ __html: post.content }}
    />
  );
}

function RecipeRender({ post, data }: TemplateRenderProps) {
  if (!isRecipeData(data)) {
    // Shouldn't happen — API-side validation enforces shape — but render
    // the body alone if it does so the page is not entirely broken.
    return <RecipeBody post={post} />;
  }

  const placement = data.panelPlacement ?? "top";

  return (
    <div className="recipe-template">
      <RecipeSummary data={data} />
      {placement === "top" ? (
        <>
          <RecipePanel data={data} />
          {post.content && <RecipeBody post={post} />}
        </>
      ) : (
        <>
          {post.content && <RecipeBody post={post} />}
          <RecipePanel data={data} />
        </>
      )}
    </div>
  );
}

function recipeJsonLd(post: TemplateRenderProps["post"], data: Record<string, unknown>) {
  if (!isRecipeData(data)) return {};
  const total = data.prepTimeMinutes + data.cookTimeMinutes;
  const images: string[] = [];
  if (post.featuredImage?.url) images.push(post.featuredImage.url);
  for (const instr of data.instructions) {
    if (instr.imageUrl) images.push(instr.imageUrl);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: post.title,
    ...(images.length > 0 && { image: images }),
    ...(post.author && {
      author: { "@type": "Person", name: post.author.name },
    }),
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(post.excerpt && { description: post.excerpt }),
    recipeIngredient: data.ingredients,
    recipeInstructions: data.instructions.map((instr) => ({
      "@type": "HowToStep",
      text: instr.step,
      ...(instr.imageUrl && { image: instr.imageUrl }),
    })),
    prepTime: isoDuration(data.prepTimeMinutes),
    cookTime: isoDuration(data.cookTimeMinutes),
    totalTime: isoDuration(total),
    recipeYield: `${data.servings} ${data.servings === 1 ? "serving" : "servings"}`,
    ...(data.cuisine && { recipeCuisine: data.cuisine }),
    ...(data.course && { recipeCategory: data.course }),
  };
}

const recipePrintStyles = `
@media print {
  body * { visibility: hidden; }
  .recipe-template, .recipe-template * { visibility: visible; }
  .recipe-template { position: absolute; inset: 0; padding: 0.5in; font-size: 11pt; color: #000; }
  .recipe-template .recipe-summary { background: none; border: 1px solid #000; }
  .recipe-template a { color: inherit; text-decoration: none; }
  .recipe-template img { max-height: 2in; }
  .recipe-template h2 { page-break-after: avoid; }
  .recipe-template li { page-break-inside: avoid; }
}
`;

export const recipe: FrontendTemplate = {
  kind: "recipe",
  Render: RecipeRender,
  jsonLd: recipeJsonLd,
  printStyles: recipePrintStyles,
};
