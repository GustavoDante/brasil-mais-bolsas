import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireStudentSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Minhas bolsas", "/aluno/minhas-bolsas");

export default async function Page() {
  await requireStudentSession();

  return (
    <>
      <PanelPageHeader title="Minhas bolsas" description="As bolsas que você contratou." />
      <UnderConstruction endpoint="GET /v1/order" />
    </>
  );
}
