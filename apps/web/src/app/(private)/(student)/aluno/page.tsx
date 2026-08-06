import { KpiGrid } from "@/components/kpi-card";
import { PanelPageHeader, panelMetadata } from "@/components/panel-page";
import { getStudentOverview } from "@/data/dashboard.data";
import { requireStudentSession } from "@/lib/auth/guards";
import { CurrentScholarship } from "./_components/current-scholarship";

export const metadata = panelMetadata("Início", "/aluno");

/**
 * Início do portal do aluno.
 *
 * A bolsa atual vem primeiro porque é o motivo de a pessoa estar aqui: saber se o
 * pagamento saiu e onde está o voucher. Os contadores são contexto, não a manchete.
 */
export default async function AlunoPage() {
  const { user } = await requireStudentSession();
  const { currentScholarship, kpis } = await getStudentOverview();

  return (
    <>
      <PanelPageHeader title="Minha conta" description={user.email} />

      <div className="space-y-6">
        <CurrentScholarship scholarship={currentScholarship} />
        <KpiGrid items={kpis} />
      </div>
    </>
  );
}
