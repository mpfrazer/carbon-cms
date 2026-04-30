import Link from "next/link";

export function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 text-center">
      <p className="text-sm font-medium text-neutral-400 mb-3">404</p>
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-4" style={{ fontFamily: "var(--carbon-font-heading)" }}>
        Page not found
      </h1>
      <p className="text-neutral-500 mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
