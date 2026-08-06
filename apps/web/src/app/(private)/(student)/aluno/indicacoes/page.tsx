import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireStudentSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Indicações", "/aluno/indicacoes");

export default async function Page() {
  await requireStudentSession();

  return (
    <>
      <PanelPageHeader title="Indicações" description="Amigos que você indicou para a plataforma." />
      <UnderConstruction endpoint="GET /v1/indications/user" />
    </>
  );
}
