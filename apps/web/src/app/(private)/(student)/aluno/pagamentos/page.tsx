import { PanelPageHeader, UnderConstruction, panelMetadata } from "@/components/panel-page";
import { requireStudentSession } from "@/lib/auth/guards";

export const metadata = panelMetadata("Pagamentos", "/aluno/pagamentos");

export default async function Page() {
  await requireStudentSession();

  return (
    <>
      <PanelPageHeader title="Pagamentos" description="Boletos, PIX e o histórico de cada cobrança." />
      <UnderConstruction endpoint="GET /v1/order/payments" />
    </>
  );
}
