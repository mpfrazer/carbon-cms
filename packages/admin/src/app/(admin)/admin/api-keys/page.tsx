export const dynamic = "force-dynamic";

import { Header } from "@/components/admin/header";
import { ApiKeysManager } from "@/components/admin/api-keys-manager";

export default function ApiKeysPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="API Keys" />
      <ApiKeysManager />
    </div>
  );
}
