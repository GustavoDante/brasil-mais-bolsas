import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getServerSession } from "@/lib/api/server";

/**
 * Moldura das rotas públicas: cabeçalho e rodapé do site.
 *
 * `<html>`/`<body>`, fontes e metadata base ficam no layout raiz (`src/app/layout.tsx`) —
 * grupo de rota não pode carregar a casca do documento, senão só as rotas dele a recebem.
 * As telas de `(auth)` e `(private)` ficam fora deste cabeçalho de propósito.
 */
export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // O header é Client Component e não pode ler a sessão sozinho — quem resolve é o layout.
  const session = await getServerSession();

  return (
    <>
      <SiteHeader isAuthenticated={!!session} />
      {children}
      <SiteFooter />
    </>
  );
}
