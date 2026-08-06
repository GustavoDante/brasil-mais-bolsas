import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Inadimplentes", "/dashboard/inadimplentes");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Inadimplentes" description="Alunos com pagamento em atraso." />
      <UnderConstruction endpoint="GET /v1/reports/students/defaulters" />
    </>
  );
}
