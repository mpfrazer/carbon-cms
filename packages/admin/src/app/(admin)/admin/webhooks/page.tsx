export const dynamic = "force-dynamic";

import { Header } from "@/components/admin/header";
import { WebhooksManager } from "@/components/admin/webhooks-manager";

export default function WebhooksPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Webhooks" />
      <WebhooksManager />
    </div>
  );
}
