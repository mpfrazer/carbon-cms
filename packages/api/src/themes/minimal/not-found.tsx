import Link from "next/link";

export function NotFound() {
  return (
    <section>
      <p>404</p>
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <p>
        <Link href="/">Back to home</Link>
      </p>
    </section>
  );
}
