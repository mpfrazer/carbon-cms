import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getStorageDriver, LocalStorageDriver } from "@/lib/storage";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const relative = segments.join("/");

  const driver = await getStorageDriver();
  const mediaDir =
    driver instanceof LocalStorageDriver
      ? driver.mediaDir
      : process.env.MEDIA_DIR ?? path.join(process.cwd(), ".media");

  const resolved = path.resolve(mediaDir, "uploads", relative);
  const allowed = path.resolve(mediaDir, "uploads");
  if (!resolved.startsWith(allowed + path.sep) && resolved !== allowed) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
