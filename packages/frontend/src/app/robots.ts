import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl } = await getSiteSettings();
  const base = siteUrl || process.env.NEXTAUTH_URL || "";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/preview",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
