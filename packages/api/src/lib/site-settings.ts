import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  postsPerPage: number;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings).where(eq(settings.autoload, true));
  const raw = Object.fromEntries(
    rows.map((r) => {
      try {
        return [r.key, JSON.parse(r.value)];
      } catch {
        return [r.key, r.value];
      }
    })
  );
  return {
    siteTitle: (raw.siteTitle as string) || "Carbon CMS",
    siteDescription: (raw.siteDescription as string) || "",
    siteUrl: (raw.siteUrl as string) || "",
    postsPerPage: Number(raw.postsPerPage) || 10,
  };
}
