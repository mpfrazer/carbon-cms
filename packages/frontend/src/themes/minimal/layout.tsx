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
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900" style={{ fontFamily: "var(--carbon-font-body)" }}>
      <header className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="hover:opacity-80 transition-opacity flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteTitle} className="h-8 w-auto object-contain brightness-0 invert" />
            ) : (
              <span
                className="text-xl font-bold tracking-tight text-white"
                style={{ fontFamily: "var(--carbon-font-heading)" }}
              >
                {siteTitle}
              </span>
            )}
          </Link>
          <nav className="flex items-center gap-1">
            {navPages.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                {p.label}
              </Link>
            ))}
            <Link href="/blog" className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
              Blog
            </Link>
            {user ? (
              <UserMenu name={user.name} role={user.role} avatarUrl={user.avatarUrl} />
            ) : (
              <>
                <Link href="/login" className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="ml-1 rounded-md px-4 py-2 text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors"
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

      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-sm text-neutral-400">
            {footerText ?? (
              <>
                &copy; {new Date().getFullYear()} {siteTitle}. Powered by{" "}
                <a href="https://github.com/mpfrazer/carbon-cms" className="underline underline-offset-2 hover:text-neutral-700 transition-colors">
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
