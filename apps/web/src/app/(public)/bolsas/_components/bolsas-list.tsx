import { listBolsas } from "@/data/scholarships.data";
import { JsonLd } from "@/components/json-ld";
import {
  BOLSAS_PAGE_SIZE,
  toBolsaFilters,
  type BolsasSearch,
} from "@/lib/search-params";
import { bolsasItemListJsonLd } from "@/lib/structured-data";
import { BolsaCard } from "./bolsa-card";
import { BolsasPagination } from "./bolsas-pagination";
import { BolsasSearchTracking } from "./bolsas-search-tracking";

interface BolsasListProps {
  search: BolsasSearch;
}

/**
 * Renderizada no servidor: o HTML já sai com os cards e os links de paginação, então
 * o buscador enxerga os resultados sem executar JavaScript.
 */
export async function BolsasList({ search }: BolsasListProps) {
  const bolsas = await listBolsas(toBolsaFilters(search));

  const totalPages = Math.max(1, Math.ceil(bolsas.length / BOLSAS_PAGE_SIZE));
  const currentPage = Math.min(search.page, totalPages);
  const start = (currentPage - 1) * BOLSAS_PAGE_SIZE;
  const pageItems = bolsas.slice(start, start + BOLSAS_PAGE_SIZE);

  if (bolsas.length === 0) {
    return (
      <>
        <BolsasSearchTracking search={search} resultCount={0} />
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-blue-800">
            Nenhuma bolsa encontrada
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Tente ajustar os filtros para encontrar novas oportunidades.
          </p>
        </div>
      </>
    );
  }

  return (
    <div>
      <BolsasSearchTracking search={search} resultCount={bolsas.length} />
      <JsonLd data={bolsasItemListJsonLd(pageItems, { startIndex: start })} />

      <p className="sr-only" role="status">
        {bolsas.length} {bolsas.length === 1 ? "bolsa encontrada" : "bolsas encontradas"}
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {pageItems.map((bolsa) => (
          <BolsaCard key={bolsa.id} data={bolsa} />
        ))}
      </div>

      <BolsasPagination
        search={search}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export function BolsasListSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-[520px] w-full max-w-[345px] animate-pulse rounded-xl border border-neutral-200 bg-white"
        />
      ))}
    </div>
  );
}
