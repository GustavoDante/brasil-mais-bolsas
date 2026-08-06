import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Relatórios", "/dashboard/relatorios");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Relatórios" description="Relatório geral de pagamentos e impacto." />
      <UnderConstruction endpoint="GET /v1/reports/general" />
    </>
  );
}
