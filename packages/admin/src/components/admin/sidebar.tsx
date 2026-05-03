"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  File,
  Image,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Pencil,
  UserCircle,
  Tag,
  FolderOpen,
  Palette,
  KeyRound,
  Webhook,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/admin/theme-provider";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/pages", label: "Pages", icon: File },
  { href: "/admin/nav", label: "Nav Menu", icon: Menu },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare, badge: "pendingComments" },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/themes", label: "Themes", icon: Palette },
  { href: "/admin/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/profile", label: "My Profile", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    fetch("/api/v1/comments?status=pending&pageSize=1")
      .then((r) => r.json())
      .then((json) => setPendingCount(json.pagination?.total ?? 0))
      .catch(() => {});
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const itemClass = (href: string, exact?: boolean) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href, exact)
        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
    }`;

  const actionClass =
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100";

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
        <Pencil className="h-5 w-5 text-neutral-900 dark:text-neutral-100" />
        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Carbon</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact, badge }) => {
          const count = badge === "pendingComments" ? pendingCount : 0;
          return (
            <Link key={href} href={href} className={itemClass(href, exact)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle + sign out */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 space-y-0.5">
        <button type="button" onClick={toggle} className={actionClass}>
          {theme === "dark"
            ? <Sun className="h-4 w-4 shrink-0" />
            : <Moon className="h-4 w-4 shrink-0" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className={actionClass}>
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
