/**
 * Camada fina de analytics — apenas empurra eventos para o `dataLayer`.
 *
 * Não instala nem depende de nenhuma ferramenta: se o GTM/GA ainda não estiver na
 * página, `trackEvent` é um no-op silencioso. Quando a tag for instalada, os eventos
 * já estarão sendo emitidos com o mesmo nome e o mesmo formato de payload.
 *
 * A dimensão principal de busca é a própria query string de `/bolsas`
 * (ver `lib/search-params.ts`), então os eventos abaixo carregam exatamente os mesmos
 * campos que aparecem na URL — relatório de evento e relatório de página batem.
 */

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
}

export const analyticsEvents = {
  /** Usuário submeteu o formulário de filtros da listagem. */
  bolsasSearch: "bolsas_search",
  /** Uma listagem foi exibida (inclui acesso direto por URL compartilhada/orgânica). */
  bolsasResults: "bolsas_results_view",
} as const;

export function trackEvent(event: string, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  const dataLayer = (window as DataLayerWindow).dataLayer;
  if (!dataLayer) return;

  dataLayer.push({
    event,
    ...Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
    ),
  });
}
