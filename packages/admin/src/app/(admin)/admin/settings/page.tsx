import { Header } from "@/components/admin/header";
import { SettingsForm } from "@/components/admin/settings-form";
import { serverGet } from "@/lib/api/server";

const SETTINGS_KEYS = ["siteTitle","siteDescription","siteUrl","adminEmail","postsPerPage","allowComments","commentModeration","aiProvider","aiBaseUrl","aiModel","aiApiKey","renderMode"];

export default async function SettingsPage() {
  const { data: initialSettings } = await serverGet(`/api/v1/settings?keys=${SETTINGS_KEYS.join(",")}`) as { data: Record<string, unknown> };
  return (
    <div>
      <Header title="Settings" />
      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
