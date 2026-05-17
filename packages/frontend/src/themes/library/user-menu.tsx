"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export function UserMenu({ name, role, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = name.charAt(0).toUpperCase();
  const adminUrl = process.env.NEXT_PUBLIC_CARBON_ADMIN_URL ?? "http://localhost:3000";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white select-none">
            {initial}
          </span>
        )}
        <span>{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg z-50">
          {role === "admin" && (
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Control Panel
            </a>
          )}
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            My Profile
          </Link>
          <div className="my-1 border-t border-neutral-100" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
