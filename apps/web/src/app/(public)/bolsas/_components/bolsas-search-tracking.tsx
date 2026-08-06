"use client";

import { useEffect } from "react";

import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { countActiveFilters, type BolsasSearch } from "@/lib/search-params";

interface BolsasSearchTrackingProps {
  search: BolsasSearch;
  resultCount: number;
}

/**
 * Emite o evento de "listagem exibida" com os filtros da URL e a quantidade de
 * resultados. Fica separado do formulário de propósito: assim o evento também dispara
 * em acesso direto (link compartilhado, campanha, busca orgânica), não só quando o
 * usuário clica em "Buscar". É a métrica que permite cruzar filtro × zero-resultados.
 */
export function BolsasSearchTracking({
  search,
  resultCount,
}: BolsasSearchTrackingProps) {
  const modalidade = search.modalidades.join(",");

  useEffect(() => {
    trackEvent(analyticsEvents.bolsasResults, {
      curso: search.course,
      faculdade: search.college,
      cidade: search.city,
      modalidade,
      pagina: search.page,
      filtros_ativos: countActiveFilters(search),
      resultados: resultCount,
      sem_resultados: resultCount === 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search.course,
    search.college,
    search.city,
    modalidade,
    search.page,
    resultCount,
  ]);

  return null;
}
