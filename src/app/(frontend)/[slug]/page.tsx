import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PageContent } from "@/themes/default/page";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([
    db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.status, "published"))).limit(1).then(r => r[0]),
    getSiteSettings(),
  ]);
  return {
    title: page?.metaTitle ?? (page ? `${page.title} — ${settings.siteTitle}` : settings.siteTitle),
    description: page?.metaDescription ?? settings.siteDescription,
  };
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params;
  const [page] = await db.select().from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .limit(1);

  if (!page) notFound();

  return <PageContent title={page.title} content={page.content} updatedAt={page.updatedAt} />;
}
