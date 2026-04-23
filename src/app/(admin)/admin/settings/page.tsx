import { Header } from "@/components/admin/header";
import { SettingsForm } from "@/components/admin/settings-form";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

const SETTINGS_KEYS = ["siteTitle","siteDescription","siteUrl","adminEmail","postsPerPage","allowComments","commentModeration","aiProvider","aiBaseUrl","aiModel","aiApiKey","renderMode"];

export default async function SettingsPage() {
  const rows = await db.select().from(settings).where(inArray(settings.key, SETTINGS_KEYS));
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
