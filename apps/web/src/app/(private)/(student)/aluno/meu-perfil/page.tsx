import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireStudentSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Meu perfil", "/aluno/meu-perfil");

export default async function Page() {
  await requireStudentSession();

  return (
    <>
      <PanelPageHeader title="Meu perfil" description="Seus dados cadastrais e de contato." />
      <UnderConstruction endpoint="GET /v1/users/me" />
    </>
  );
}
