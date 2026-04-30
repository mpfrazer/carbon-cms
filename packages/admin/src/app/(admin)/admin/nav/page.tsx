import { NavEditor, type NavItem } from "@/components/admin/nav-editor";

async function getNavData() {
  const [settingsRes, pagesRes] = await Promise.all([
    fetch(`${process.env.CARBON_API_URL ?? "http://localhost:3001"}/api/v1/settings?keys=navMenu`, { cache: "no-store" }),
    fetch(`${process.env.CARBON_API_URL ?? "http://localhost:3001"}/api/v1/pages?status=published&pageSize=200`, { cache: "no-store" }),
  ]);

  const settings = settingsRes.ok ? await settingsRes.json() : { data: {} };
  const pages = pagesRes.ok ? await pagesRes.json() : { data: [] };

  let navItems: NavItem[] = [];
  if (settings.data?.navMenu) {
    try {
      const parsed = Array.isArray(settings.data.navMenu) ? settings.data.navMenu : JSON.parse(settings.data.navMenu);
      if (Array.isArray(parsed)) navItems = parsed;
    } catch { /* start empty */ }
  }

  const allPages: { id: string; title: string; slug: string }[] = pages.data ?? [];

  return { navItems, allPages };
}

export default async function NavPage() {
  const { navItems, allPages } = await getNavData();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Navigation menu</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Drag pages into the menu or add custom links. Changes apply to the frontend nav after saving.
        </p>
      </div>
      <NavEditor initialNavItems={navItems} allPages={allPages} />
    </div>
  );
}
