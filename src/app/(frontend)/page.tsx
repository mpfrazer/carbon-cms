import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PageContent } from "@/themes/default/page";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    db.select().from(pages).where(and(eq(pages.slug, "home"), eq(pages.status, "published"))).limit(1).then(r => r[0]),
    getSiteSettings(),
  ]);
  return {
    title: page?.metaTitle ?? settings.siteTitle,
    description: page?.metaDescription ?? settings.siteDescription,
  };
}

export default async function HomePage() {
  const [page] = await db.select().from(pages)
    .where(and(eq(pages.slug, "home"), eq(pages.status, "published")))
    .limit(1);

  if (!page) notFound();

  return <PageContent title={page.title} content={page.content} updatedAt={page.updatedAt} />;
}
