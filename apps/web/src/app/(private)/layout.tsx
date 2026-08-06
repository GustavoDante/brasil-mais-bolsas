import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server";

/**
 * Segunda camada da guarda das rotas privadas — a que decide de fato.
 *
 * O middleware só sabe que o cookie existe; aqui `getServerSession()` valida o token
 * contra a API e devolve `null` também quando ele expirou. Como a função é memoizada por
 * request (`cache()`), a página abaixo pode chamá-la de novo sem custo.
 *
 * Só cuida de **autenticação**. Qual painel cabe a qual papel é decidido um nível abaixo,
 * nos layouts de `(management)` e `(student)`, com as guardas de `@/lib/auth/guards`.
 */
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    // Fallback é a home pública, não `/dashboard`: sem o `x-pathname` não dá para saber o
    // papel, e mandar um aluno para o backoffice seria devolvê-lo a uma rota que a guarda
    // de papel expulsa em seguida.
    const callbackUrl = (await headers()).get("x-pathname") ?? "/";
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <>{children}</>;
}
