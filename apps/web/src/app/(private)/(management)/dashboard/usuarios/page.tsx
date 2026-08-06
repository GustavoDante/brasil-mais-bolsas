import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireAdminSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Usuários", "/dashboard/usuarios");

export default async function Page() {
  await requireAdminSession();

  return (
    <>
      <PanelPageHeader title="Usuários" description="Contas de admin, gestor e aluno." />
      <UnderConstruction endpoint="GET /v1/users" />
    </>
  );
}
