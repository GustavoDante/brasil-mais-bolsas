import { KpiGrid } from "@/components/kpi-card";
import { PanelPageHeader, panelMetadata } from "@/components/panel-page";
import { getAdminOverview, getManagerOverview } from "@/data/dashboard.data";
import { requireManagementSession } from "@/lib/auth/guards";
import { RecentOrders } from "./_components/recent-orders";

export const metadata = panelMetadata("Visão geral", "/dashboard");

/**
 * Visão geral do backoffice.
 *
 * Uma rota, dois recortes. O admin vê a plataforma inteira; o gestor vê a instituição
 * dele — e o recorte não é feito aqui, é a API que escopa cada consulta pelo
 * `institution_id` do token. O que muda nesta página é só **quais** números fazem sentido
 * para cada um (o gestor não tem "instituições", o admin não tem "minha instituição").
 */
export default async function DashboardPage() {
  const { role } = await requireManagementSession();

  if (role === "admin") {
    const { kpis, recentOrders } = await getAdminOverview();

    return (
      <>
        <PanelPageHeader
          title="Visão geral"
          description="Todas as instituições, bolsas e pedidos da plataforma."
        />
        <div className="space-y-6">
          <KpiGrid items={kpis} />
          <RecentOrders orders={recentOrders} />
        </div>
      </>
    );
  }

  const { institutionName, institutionCity, kpis, recentOrders } =
    await getManagerOverview();

  return (
    <>
      <PanelPageHeader
        title={institutionName ?? "Minha instituição"}
        description={
          institutionName
            ? [institutionCity, "Bolsas e pedidos da sua instituição."]
                .filter(Boolean)
                .join(" · ")
            : "Sua conta ainda não está vinculada a uma instituição. Fale com o administrador."
        }
      />
      <div className="space-y-6">
        <KpiGrid items={kpis} />
        <RecentOrders orders={recentOrders} />
      </div>
    </>
  );
}
