import Link from "next/link";
import { UserMenu } from "./user-menu";

interface NavPage { label: string; href: string; }

interface SiteLayoutProps {
  siteTitle: string;
  navPages: NavPage[];
  children: React.ReactNode;
  user?: { name: string; role: string; avatarUrl?: string | null } | null;
  logoUrl?: string | null;
  footerText?: string | null;
}

export function SiteLayout({ siteTitle, navPages, children, user, logoUrl, footerText }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900" style={{ fontFamily: "var(--carbon-font-body)" }}>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="hover:opacity-75 transition-opacity">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteTitle} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--carbon-font-heading)" }}>
                {siteTitle}
              </span>
            )}
          </Link>
          <nav className="flex items-center gap-6">
            {navPages.map((p) => (
              <Link key={p.href} href={p.href}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                {p.label}
              </Link>
            ))}
            <Link href="/blog" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              Blog
            </Link>
            {user ? (
              <UserMenu name={user.name} role={user.role} avatarUrl={user.avatarUrl} />
            ) : (
              <>
                <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "var(--carbon-accent)" }}
                >
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
            {footerText ?? (
              <>
                &copy; {new Date().getFullYear()} {siteTitle}. Powered by{" "}
                <a href="https://github.com/mpfrazer/carbon-cms" className="underline underline-offset-2 hover:text-neutral-200 transition-colors">
                  Carbon CMS
                </a>.
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
