import { NextRequest } from "next/server";
import { desc, count } from "drizzle-orm";
import path from "path";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { ok, created, badRequest, serverError, paginated, parsePagination } from "@/lib/api/response";
import { uploadFile } from "@/lib/storage";
import { dispatchWebhooks } from "@/lib/webhook";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(media).orderBy(desc(media.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(media),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const uploadedBy = req.headers.get("x-user-id");
    if (!uploadedBy) return badRequest("Authentication required");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file provided");

    if (!ALLOWED_TYPES.includes(file.type)) return badRequest(`File type "${file.type}" is not allowed`);
    if (file.size > MAX_SIZE) return badRequest("File exceeds 10 MB limit");

    const ext = path.extname(file.name).toLowerCase();
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(key, buffer, file.type);

    const altText = (formData.get("altText") as string | null) ?? undefined;
    const caption = (formData.get("caption") as string | null) ?? undefined;

    const [item] = await db
      .insert(media)
      .values({ filename: key, originalFilename: file.name, mimeType: file.type, size: file.size, url, altText, caption, uploadedBy })
      .returning();

    dispatchWebhooks("media.uploaded", item);
    return created(item);
  } catch (e) {
    return serverError(e);
  }
}
