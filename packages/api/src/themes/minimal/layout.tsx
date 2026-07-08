import Link from "next/link";

interface NavPage {
  slug: string;
  title: string;
}

interface SiteLayoutProps {
  siteTitle: string;
  navPages: NavPage[];
  children: React.ReactNode;
}

export function SiteLayout({ siteTitle, navPages, children }: SiteLayoutProps) {
  return (
    <>
      <header>
        <Link href="/">{siteTitle}</Link>
        <nav>
          {navPages.map((p) => (
            <Link key={p.slug} href={`/${p.slug === "home" ? "" : p.slug}`}>
              {p.title}
            </Link>
          ))}
          <Link href="/blog">Blog</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <p>&copy; {new Date().getFullYear()} {siteTitle}</p>
      </footer>
    </>
  );
}
