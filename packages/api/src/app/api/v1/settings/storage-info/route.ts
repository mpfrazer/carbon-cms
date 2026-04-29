import path from "path";
import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({
    effectiveMediaDir: process.env.MEDIA_DIR ?? path.join(process.cwd(), ".media"),
    effectivePublicUrl: process.env.CARBON_PUBLIC_URL ?? "http://localhost:3001",
  });
}
