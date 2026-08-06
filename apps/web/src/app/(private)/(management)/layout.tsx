import { requireManagementSession } from "@/lib/auth/guards";
import { ManagementShell } from "./_components/management-shell";

/**
 * Painel de admin e gestor.
 *
 * Mesmas telas para os dois papéis — o admin enxerga o todo e pode mais; o gestor vê e
 * cria só o que é da instituição dele, e esse recorte é feito pela **API**, que já escopa
 * as consultas por `req.user.institution_id`. Aqui só se decide quem entra: aluno que cair
 * numa URL deste grupo é devolvido para `/aluno`.
 */
export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, user } = await requireManagementSession();

  return (
    <ManagementShell role={role} email={user.email}>
      {children}
    </ManagementShell>
  );
}
