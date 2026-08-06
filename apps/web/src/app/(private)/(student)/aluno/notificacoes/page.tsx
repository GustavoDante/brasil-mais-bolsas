import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireStudentSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Notificações", "/aluno/notificacoes");

export default async function Page() {
  await requireStudentSession();

  return (
    <>
      <PanelPageHeader title="Notificações" description="Avisos sobre sua bolsa e seus pagamentos." />
      <UnderConstruction endpoint="GET /v1/notifications" />
    </>
  );
}
