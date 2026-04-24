import Link from "next/link";
import { UserMenu } from "./user-menu";

interface NavPage { slug: string; title: string; }

interface SiteLayoutProps {
  siteTitle: string;
  navPages: NavPage[];
  children: React.ReactNode;
  user?: { name: string; role: string } | null;
}

export function SiteLayout({ siteTitle, navPages, children, user }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-semibold tracking-tight text-neutral-900 hover:text-neutral-700 transition-colors">
            {siteTitle}
          </Link>
          <nav className="flex items-center gap-6">
            {navPages.map((p) => (
              <Link key={p.slug} href={`/${p.slug === "home" ? "" : p.slug}`}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                {p.title}
              </Link>
            ))}
            <Link href="/blog" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              Blog
            </Link>
            {user ? (
              <UserMenu name={user.name} role={user.role} />
            ) : (
              <>
                <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                  Sign in
                </Link>
                <Link href="/register"
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-900 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} {siteTitle}. Powered by{" "}
            <a href="https://github.com/mpfrazer/carbon-cms" className="underline underline-offset-2 hover:text-neutral-200 transition-colors">
              Carbon CMS
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
