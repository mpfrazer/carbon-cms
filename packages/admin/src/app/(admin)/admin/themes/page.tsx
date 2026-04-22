import { Header } from "@/components/admin/header";
import { ThemesManager } from "@/components/admin/themes-manager";
import { serverGet } from "@/lib/server-api";

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
  preview?: string;
}

export default async function ThemesPage() {
  const themes = await serverGet<Theme[]>("/api/v1/themes");
  return (
    <div>
      <Header title="Themes" />
      <ThemesManager themes={themes} />
    </div>
  );
}
