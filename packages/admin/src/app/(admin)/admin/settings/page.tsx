import { Header } from "@/components/admin/header";
import { SettingsForm } from "@/components/admin/settings-form";
import { serverGet } from "@/lib/server-api";

const SETTINGS_KEYS = ["siteTitle","siteDescription","siteUrl","adminEmail","postsPerPage","allowComments","commentModeration","aiProvider","aiBaseUrl","aiModel","aiApiKey","renderMode"].join(",");

export default async function SettingsPage() {
  const initialSettings = await serverGet<Record<string, unknown>>(`/api/v1/settings?keys=${SETTINGS_KEYS}`);
  return (
    <div>
      <Header title="Settings" />
      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
