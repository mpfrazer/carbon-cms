import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: { default: "Carbon CMS", template: "%s — Carbon CMS" },
  description: "A lightweight, open-source CMS",
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const rssUrl = `${process.env.NEXTAUTH_URL ?? ""}/rss.xml`;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href={rssUrl} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
