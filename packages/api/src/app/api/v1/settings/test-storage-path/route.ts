import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { validateMediaPath, testMediaPathWritable } from "@/lib/storage-path";

const schema = z.object({ path: z.string() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("path is required");

    const staticErr = validateMediaPath(parsed.data.path);
    if (staticErr) return badRequest(staticErr);

    const ioErr = await testMediaPathWritable(parsed.data.path);
    if (ioErr) return badRequest(ioErr);

    return ok({ writable: true });
  } catch (e) {
    return serverError(e);
  }
}
