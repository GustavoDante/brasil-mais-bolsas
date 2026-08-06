import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Bolsas", "/dashboard/bolsas");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Bolsas" description="Bolsas ofertadas pelas instituições." />
      <UnderConstruction endpoint="GET /v1/scholarships/list/backoffice" />
    </>
  );
}
