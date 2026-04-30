"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { SearchMode } from "@/lib/site-settings";

interface MobileNavProps {
  navPages: { label: string; href: string }[];
  searchMode: SearchMode;
  user?: { name: string; role: string; avatarUrl?: string | null } | null;
}

export function MobileNav({ navPages, searchMode, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-t border-neutral-200 bg-white shadow-sm z-50 py-2">
          {navPages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              onClick={close}
              className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {p.label}
            </Link>
          ))}
          <Link href="/blog" onClick={close} className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
            Blog
          </Link>
          {searchMode === "page" && (
            <Link href="/search" onClick={close} className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              Search
            </Link>
          )}
          <div className="my-2 border-t border-neutral-100" />
          {user ? (
            <Link href="/account" onClick={close} className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
              My Profile
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={close} className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                Sign in
              </Link>
              <Link href="/register" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
