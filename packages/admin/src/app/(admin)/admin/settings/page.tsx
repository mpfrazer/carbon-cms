import { Header } from "@/components/admin/header";
import { SettingsForm } from "@/components/admin/settings-form";
import { serverGet } from "@/lib/api/server";

const SETTINGS_KEYS = ["siteTitle","siteDescription","siteUrl","adminEmail","postsPerPage","allowComments","commentModeration","requireLoginToComment","requireEmailVerification","smtpHost","smtpPort","smtpUser","smtpPass","smtpFrom","smtpSecure","storageDriver","mediaDir","awsS3Bucket","awsRegion","awsAccessKeyId","awsSecretAccessKey","awsS3UrlBase","aiProvider","aiBaseUrl","aiModel","aiApiKey","renderMode"];

export default async function SettingsPage() {
  const [{ data: initialSettings }, { data: storageInfo }] = await Promise.all([
    serverGet(`/api/v1/settings?keys=${SETTINGS_KEYS.join(",")}`) as Promise<{ data: Record<string, unknown> }>,
    serverGet("/api/v1/settings/storage-info") as Promise<{ data: { effectiveMediaDir: string; effectivePublicUrl: string } }>,
  ]);
  return (
    <div>
      <Header title="Settings" />
      <SettingsForm
        initialSettings={initialSettings}
        effectiveMediaDir={storageInfo.effectiveMediaDir}
        effectivePublicUrl={storageInfo.effectivePublicUrl}
      />
    </div>
  );
}
