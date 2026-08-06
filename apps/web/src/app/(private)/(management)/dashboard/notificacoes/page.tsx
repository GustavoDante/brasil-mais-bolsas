import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Notificações", "/dashboard/notificacoes");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Notificações" description="Avisos enviados pela plataforma." />
      <UnderConstruction endpoint="GET /v1/notifications" />
    </>
  );
}
