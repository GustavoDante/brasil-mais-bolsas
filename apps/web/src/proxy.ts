import { NextResponse, type NextRequest } from "next/server";
import { apiConfig } from "@/lib/api/config";

/**
 * Primeira camada da guarda das rotas privadas.
 *
 * `proxy.ts` é o nome atual da convenção que antes era `middleware.ts` (renomeada no
 * Next 16; o nome antigo ainda funciona, mas avisa depreciação no build).
 *
 * Roda antes da renderização, então só faz o que é barato: olha se o cookie de sessão
 * **existe**. Isso corta o caso comum (visitante deslogado) antes de renderizar qualquer
 * coisa. Saber se o token ainda é válido exigiria uma chamada a `GET /v1/auth/me`, cara
 * demais para todo request — essa checagem fica no `(private)/layout.tsx`, que já tem a
 * sessão memoizada.
 *
 * O `matcher` enxerga o caminho real da URL, e grupos de rota (`(private)`) não aparecem
 * nela: **toda rota nova dentro de `(private)` precisa ser somada aqui**.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(apiConfig.sessionCookieName)) {
    // O layout precisa do caminho original para montar o `callbackUrl` caso o token esteja
    // vencido, e não existe API de "rota atual" dentro de um Server Component.
    const headers = new Headers(request.headers);
    headers.set(
      "x-pathname",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.next({ request: { headers } });
  }

  const loginUrl = new URL("/entrar", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
