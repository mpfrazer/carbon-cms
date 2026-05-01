import { Header } from "@/components/admin/header";
import { SettingsForm } from "@/components/admin/settings-form";
import { serverGet } from "@/lib/api/server";

const SETTINGS_KEYS = ["siteTitle","siteDescription","siteUrl","adminEmail","postsPerPage","showBlogLink","searchMode","searchInputMode","allowComments","commentModeration","requireLoginToComment","requireEmailVerification","smtpHost","smtpPort","smtpUser","smtpPass","smtpFrom","smtpSecure","storageDriver","mediaDir","awsS3Bucket","awsRegion","awsAccessKeyId","awsSecretAccessKey","awsS3UrlBase","aiProvider","aiBaseUrl","aiModel","aiApiKey","renderMode"];

interface ThemeCapabilities {
  blog: boolean;
  search: { header: boolean; page: boolean };
  pageBuilder: boolean;
  comments: boolean;
}

interface ThemeConfigResponse {
  capabilities?: ThemeCapabilities;
  overrides?: Record<string, unknown>;
}

export default async function SettingsPage() {
  const [{ data: initialSettings }, { data: storageInfo }, themeConfigRes] = await Promise.all([
    serverGet(`/api/v1/settings?keys=${SETTINGS_KEYS.join(",")}`) as Promise<{ data: Record<string, unknown> }>,
    serverGet("/api/v1/settings/storage-info") as Promise<{ data: { effectiveMediaDir: string; effectivePublicUrl: string } }>,
    serverGet("/api/v1/themes/active/config").catch(() => null) as Promise<{ data: ThemeConfigResponse } | null>,
  ]);

  const themeCapabilities = themeConfigRes?.data?.capabilities ?? null;

  return (
    <div>
      <Header title="Settings" />
      <SettingsForm
        initialSettings={initialSettings}
        effectiveMediaDir={storageInfo.effectiveMediaDir}
        effectivePublicUrl={storageInfo.effectivePublicUrl}
        themeCapabilities={themeCapabilities}
      />
    </div>
  );
}
