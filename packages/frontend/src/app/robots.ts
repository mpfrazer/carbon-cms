import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const res = await apiGet<{ data: { siteUrl?: string } }>("/api/v1/settings?keys=siteUrl");
  const base = res.data?.siteUrl || process.env.NEXTAUTH_URL || "http://localhost:3003";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
