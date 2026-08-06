import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Alunos", "/dashboard/alunos");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Alunos" description="Alunos cadastrados e o andamento de cada um." />
      <UnderConstruction endpoint="GET /v1/reports/students" />
    </>
  );
}
