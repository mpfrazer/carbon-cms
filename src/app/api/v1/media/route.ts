import { NextRequest } from "next/server";
import { desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { ok, created, badRequest, serverError, paginated, parsePagination } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(media).orderBy(desc(media.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(media),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return badRequest("Authentication required");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return badRequest("No file provided");

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return badRequest(`File type "${file.type}" is not allowed`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return badRequest("File exceeds 10MB limit");

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    const altText = (formData.get("altText") as string | null) ?? undefined;
    const caption = (formData.get("caption") as string | null) ?? undefined;

    const [item] = await db
      .insert(media)
      .values({
        filename,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        altText,
        caption,
        uploadedBy: session.user.id,
      })
      .returning();

    return created(item);
  } catch {
    return serverError();
  }
}
