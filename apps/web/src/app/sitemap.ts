import type { MetadataRoute } from "next";

import { listCities, listCourses, listInstitutions } from "@/data/catalog.data";
import { listBolsaIds } from "@/data/scholarships.data";
import { buildBolsasHref } from "@/lib/search-params";
import { absoluteUrl } from "@/lib/seo";

/**
 * Limite por faceta. Impede que o sitemap exploda quando o catálogo da API crescer —
 * o que interessa ao buscador são as facetas de maior volume de busca, não a cauda
 * inteira. Se um dia passar de ~10 mil URLs, migrar para `generateSitemaps`.
 */
const MAX_FACET_URLS = 200;

/** Uma requisição que falhar não pode derrubar o sitemap inteiro. */
async function safeList<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const [bolsaIds, courses, cities, institutions] = await Promise.all([
    safeList(listBolsaIds),
    safeList(listCourses),
    safeList(listCities),
    safeList(listInstitutions),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/bolsas"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Facetas simples (um filtro só) são páginas de destino legítimas — "bolsas de
  // Direito", "bolsas em Recife". Combinações ficam de fora: são `noindex`.
  const facetRoutes: MetadataRoute.Sitemap = [
    ...courses.slice(0, MAX_FACET_URLS).map((course) => ({ course: course.name })),
    ...cities.slice(0, MAX_FACET_URLS).map((city) => ({ city: city.name })),
    ...institutions
      .slice(0, MAX_FACET_URLS)
      .map((institution) => ({ college: institution.name })),
  ].map((search) => ({
    url: absoluteUrl(buildBolsasHref(search)),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const detailRoutes: MetadataRoute.Sitemap = bolsaIds.map((id) => ({
    url: absoluteUrl(`/bolsas/${id}`),
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...facetRoutes, ...detailRoutes];
}
