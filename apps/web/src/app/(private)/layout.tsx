import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server";

/**
 * Segunda camada da guarda das rotas privadas — a que decide de fato.
 *
 * O middleware só sabe que o cookie existe; aqui `getServerSession()` valida o token
 * contra a API e devolve `null` também quando ele expirou. Como a função é memoizada por
 * request (`cache()`), a página abaixo pode chamá-la de novo sem custo.
 */
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    const callbackUrl = (await headers()).get("x-pathname") ?? "/dashboard";
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <>{children}</>;
}
