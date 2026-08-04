"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toUserMessage } from "@/lib/api/errors";

/**
 * Busca assíncrona para Client Components (autocomplete de cidades/cursos, filtros que
 * dependem de interação). Server Components devem chamar `src/data/*` direto — este hook
 * é para o que só existe depois do clique do usuário.
 *
 * Cancela a requisição anterior a cada mudança de dependência e ignora respostas de
 * chamadas obsoletas, evitando resultados fora de ordem.
 *
 * ```tsx
 * const { data, isLoading } = useApiQuery(
 *   ({ signal }) => searchCities(term, { signal }),
 *   [term],
 *   { initialData: [], enabled: term.length >= 2, debounceMs: 300 }
 * );
 * ```
 */
export interface UseApiQueryOptions<TData> {
  initialData?: TData;
  /** Quando falso, não dispara a busca (e mantém o dado atual). */
  enabled?: boolean;
  /** Atraso antes de disparar, em ms. Útil para busca enquanto digita. */
  debounceMs?: number;
}

export interface UseApiQueryResult<TData> {
  data: TData | undefined;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useApiQuery<TData>(
  queryFn: (context: { signal: AbortSignal }) => Promise<TData>,
  deps: readonly unknown[],
  { initialData, enabled = true, debounceMs = 0 }: UseApiQueryOptions<TData> = {}
): UseApiQueryResult<TData> {
  const [data, setData] = useState<TData | undefined>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // A função de busca fica numa ref (atualizada em efeito, nunca durante o render) para
  // que o consumidor possa passar uma closure inline sem memoizar.
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await queryFnRef.current({ signal: controller.signal });
        if (!cancelled) setData(result);
      } catch (caught) {
        if (cancelled || controller.signal.aborted) return;
        setError(toUserMessage(caught, "Não foi possível carregar os dados."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const timer = debounceMs > 0 ? setTimeout(() => void run(), debounceMs) : null;
    if (!timer) void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
    // `queryFn` é lido por ref de propósito — as dependências reais são as do consumidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, debounceMs, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  // Derivado: com a busca desligada não há carregamento em andamento, e assim o efeito
  // não precisa alterar estado de forma síncrona.
  return { data, error, isLoading: enabled && isLoading, refetch };
}
