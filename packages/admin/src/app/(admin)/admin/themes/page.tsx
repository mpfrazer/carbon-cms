import { Header } from "@/components/admin/header";
import { ThemesManager } from "@/components/admin/themes-manager";
import { serverGet } from "@/lib/api/server";

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
  preview?: string;
}

export default async function ThemesPage() {
  const { data: themes } = await serverGet("/api/v1/themes") as { data: Theme[] };
  return (
    <div>
      <Header title="Themes" />
      <ThemesManager themes={themes} />
    </div>
  );
}
