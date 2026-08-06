import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Pedidos", "/dashboard/pedidos");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Pedidos" description="Pedidos de bolsa e seus pagamentos." />
      <UnderConstruction endpoint="GET /v1/order" />
    </>
  );
}
