import { getThemeComponents } from "@/lib/theme-provider";

export default async function NotFound() {
  const { NotFound: NotFoundComponent } = await getThemeComponents();
  return <NotFoundComponent />;
}
