import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Renovações", "/dashboard/renovacoes");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Renovações" description="Bolsas que entram em renovação nos próximos dias." />
      <UnderConstruction endpoint="GET /v1/reports/students/renewals" />
    </>
  );
}
