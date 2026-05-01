import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { isBuiltIn, compileTheme } from "@/lib/theme-compiler";

type Params = { params: Promise<{ slug: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  if (isBuiltIn(slug)) return badRequest("Built-in themes do not need compilation.");

  try {
    const result = await compileTheme(slug);
    if (!result.ok) {
      return ok({ compiled: false, errors: result.errors });
    }
    return ok({ compiled: true });
  } catch (e) {
    return serverError(e);
  }
}
