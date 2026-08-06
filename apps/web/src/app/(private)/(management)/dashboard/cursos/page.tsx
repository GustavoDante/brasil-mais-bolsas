import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Cursos", "/dashboard/cursos");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Cursos" description="Cursos vinculados às bolsas." />
      <UnderConstruction endpoint="GET /v1/courses" />
    </>
  );
}
