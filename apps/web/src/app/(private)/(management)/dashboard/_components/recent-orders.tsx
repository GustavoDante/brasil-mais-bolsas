import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentOrderRow } from "@/types/dashboard";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

/**
 * Últimos pedidos.
 *
 * Lista, não tabela: são cinco linhas e o painel ainda não tem o primitivo `table`.
 * A tela cheia de `/dashboard/pedidos` é que vai precisar dele.
 */
export function RecentOrders({ orders }: { orders: RecentOrderRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimos pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            Nenhum pedido por aqui ainda.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-800">
                    {order.studentName ?? "Aluno sem nome"}
                  </p>
                  <p className="truncate text-sm text-neutral-500">
                    {order.scholarshipTitle ?? "Curso não informado"}
                    {order.institutionName && ` · ${order.institutionName}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">
                    {formatDate(order.createdAt)}
                  </span>
                  <Badge variant={order.paid ? "default" : "secondary"}>
                    {order.paid ? "Pago" : "Pendente"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
