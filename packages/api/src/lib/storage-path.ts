import path from "path";
import fs from "fs/promises";

export function validateMediaPath(p: string): string | null {
  if (!p || !p.trim()) return "Path cannot be empty.";
  if (!path.isAbsolute(p)) return "Path must be absolute (e.g. /var/carbon/media).";
  if (p.includes("\0")) return "Path contains invalid characters.";
  return null;
}

export async function testMediaPathWritable(p: string): Promise<string | null> {
  try {
    await fs.mkdir(p, { recursive: true });
    const probe = path.join(p, ".carbon-write-test");
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    return null;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : "Unknown error.";
  }
}
