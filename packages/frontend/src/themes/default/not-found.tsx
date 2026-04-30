import Link from "next/link";

export function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-4">404</p>
      <h1
        className="text-4xl font-bold tracking-tight text-neutral-900 mb-4"
        style={{ fontFamily: "var(--carbon-font-heading)" }}
      >
        Page not found
      </h1>
      <p className="text-neutral-500 mb-10 text-lg">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
