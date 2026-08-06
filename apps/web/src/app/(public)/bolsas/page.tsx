import { Suspense } from "react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { listCities, listCourses, listInstitutions } from "@/data/catalog.data";
import {
  BOLSA_MODALIDADES,
  buildBolsasHref,
  countActiveFilters,
  parseBolsasSearch,
  type BolsasSearch,
  type RawSearchParams,
} from "@/lib/search-params";
import { absoluteUrl, siteConfig, truncateDescription } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { BolsasFilters } from "./_components/bolsas-filters";
import { BolsasList, BolsasListSkeleton } from "./_components/bolsas-list";

interface BolsasPageProps {
  searchParams: Promise<RawSearchParams>;
}

/**
 * Título e descrição derivados dos filtros da URL. Cada faceta indexável ganha um
 * título próprio ("Bolsas de Direito em Recife, PE"), que é o que aparece na SERP.
 */
function buildSearchHeadline(search: BolsasSearch): string {
  // A categoria é o filtro mais amplo e não tem controle próprio na listagem — sem ela no
  // título, quem chega pela home não vê que a busca está restrita a um tipo de ensino.
  const parts: string[] = [
    search.category ? `Bolsas em ${search.category}` : "Bolsas de estudo",
  ];

  if (search.course) parts.push(`em ${search.course}`);
  if (search.college) parts.push(`na ${search.college}`);
  if (search.city) parts.push(`em ${search.city}`);
  if (search.modalidades.length > 0) {
    parts.push(`na modalidade ${search.modalidades.join(" ou ")}`);
  }

  return parts.join(" ");
}

export async function generateMetadata({
  searchParams,
}: BolsasPageProps): Promise<Metadata> {
  const search = parseBolsasSearch(await searchParams);
  const activeFilters = countActiveFilters(search);
  const headline = buildSearchHeadline(search);
  const canonical = absoluteUrl(buildBolsasHref(search));

  /**
   * Estratégia de indexação da navegação facetada: uma faceta só (ex.: `?curso=Direito`)
   * é uma página de destino legítima e fica indexável; combinações de filtros e páginas
   * a partir da 2ª são conteúdo praticamente duplicado e ficam `noindex, follow` — o
   * `follow` mantém o rastreamento chegando nas páginas de detalhe.
   */
  const indexable = activeFilters <= 1 && search.page === 1;

  const title =
    search.page > 1 ? `${headline} — Página ${search.page}` : headline;

  const description = truncateDescription(
    activeFilters === 0
      ? siteConfig.description
      : `Veja as ${headline.toLowerCase()} disponíveis no ${siteConfig.name}. Compare mensalidades, descontos, turnos e garanta a sua vaga.`
  );

  return {
    title,
    description,
    alternates: { canonical },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BolsasPage({ searchParams }: BolsasPageProps) {
  const search = parseBolsasSearch(await searchParams);

  const [courses, colleges, cities] = await Promise.all([
    listCourses(),
    listInstitutions(),
    listCities(),
  ]);

  const headline = buildSearchHeadline(search);

  return (
    <main className="w-full bg-neutral-100 py-9">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Bolsas de estudo", path: "/bolsas" },
        ])}
      />

      <div className="mx-auto w-full max-w-359 px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-brand-blue-900 md:text-3xl">
            {headline}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Filtre por curso, faculdade, cidade e modalidade para encontrar a bolsa
            certa para você.
          </p>
        </header>

        <BolsasFilters
          search={search}
          courses={courses.map((course) => course.name)}
          colleges={colleges.map((college) => college.name)}
          cities={cities.map((city) => city.name)}
          modalidades={BOLSA_MODALIDADES}
        />

        <div className="mt-9">
          {/* `key` remonta a lista a cada nova busca, mantendo o formulário responsivo
              enquanto os resultados carregam. */}
          <Suspense key={buildBolsasHref(search)} fallback={<BolsasListSkeleton />}>
            <BolsasList search={search} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
