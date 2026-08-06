import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireAdminSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Instituições", "/dashboard/instituicoes");

export default async function Page() {
  await requireAdminSession();

  return (
    <>
      <PanelPageHeader title="Instituições" description="Instituições parceiras e seus gestores." />
      <UnderConstruction endpoint="GET /v1/institutions" />
    </>
  );
}
