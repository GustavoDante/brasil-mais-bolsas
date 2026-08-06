import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireManagementSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Meu perfil", "/dashboard/perfil");

export default async function Page() {
  await requireManagementSession();

  return (
    <>
      <PanelPageHeader title="Meu perfil" description="Seus dados de acesso." />
      <UnderConstruction endpoint="GET /v1/users/me" />
    </>
  );
}
