import { Header } from "@/components/admin/header";
import { SettingsForm } from "@/components/admin/settings-form";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq, or, inArray } from "drizzle-orm";

const AI_KEYS = ["aiProvider", "aiBaseUrl", "aiModel", "aiApiKey"];

export default async function SettingsPage() {
  const rows = await db
    .select()
    .from(settings)
    .where(or(eq(settings.autoload, true), inArray(settings.key, AI_KEYS)));

  const initialSettings = Object.fromEntries(
    rows.map((r) => {
      try { return [r.key, JSON.parse(r.value)]; } catch { return [r.key, r.value]; }
    })
  );

  return (
    <div>
      <Header title="Settings" />
      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
