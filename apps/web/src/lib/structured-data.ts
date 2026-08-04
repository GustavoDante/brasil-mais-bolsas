/**
 * Construtores de dados estruturados (schema.org / JSON-LD).
 *
 * Ficam aqui, fora das páginas, para que o vocabulário do schema não se misture com o
 * JSX e para que os `@id` fiquem consistentes entre as rotas — é o `@id` que permite ao
 * Google entender que a organização citada na home é a mesma da página de detalhe.
 */
import { parseBRL } from "@/lib/format";
import { absoluteUrl, siteConfig, truncateDescription } from "@/lib/seo";
import type { BolsaCardData, BolsaDetailData } from "@/types/scholarship";

const ORGANIZATION_ID = absoluteUrl("/#organization");
const WEBSITE_ID = absoluteUrl("/#website");

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    areaServed: { "@type": "Country", name: "Brasil" },
  };
}

/**
 * `WebSite` + `SearchAction`: descreve a busca de bolsas para o Google. O `target` usa o
 * mesmo parâmetro `curso` da listagem, então a caixa de busca dos resultados cai
 * direto numa URL válida de `/bolsas`.
 */
export function webSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: siteConfig.name,
    inLanguage: "pt-BR",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/bolsas")}?curso={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Trilha de navegação. `items` é `[{ name, path }]`, do mais genérico ao atual. */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Listagem de bolsas como `ItemList`. Só referencia as URLs dos itens (formato
 * "unnamed items" do schema.org) — o conteúdo rico de cada bolsa está na própria
 * página de detalhe, que traz o `Course` completo.
 */
export function bolsasItemListJsonLd(
  bolsas: BolsaCardData[],
  { startIndex = 0 }: { startIndex?: number } = {}
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: bolsas.length,
    itemListElement: bolsas.map((bolsa, index) => ({
      "@type": "ListItem",
      position: startIndex + index + 1,
      url: absoluteUrl(`/bolsas/${bolsa.id}`),
      name: `${bolsa.course} — ${bolsa.school}`,
    })),
  };
}

const COURSE_MODE: Record<BolsaDetailData["modalidade"], string> = {
  Presencial: "onsite",
  Semi: "blended",
  EaD: "online",
};

/**
 * `Course` + `CourseInstance` + `Offer` da bolsa.
 *
 * O preço declarado é a mensalidade **com desconto** (é o que o usuário paga e o que a
 * página anuncia); `priceCurrency` e `unitText` deixam explícito que é valor mensal.
 */
export function bolsaCourseJsonLd(detail: BolsaDetailData): Record<string, unknown> {
  const url = absoluteUrl(`/bolsas/${detail.id}`);
  const price = parseBRL(`${detail.discountedPrice}${detail.discountedPriceCents}`);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    url,
    name: detail.title,
    description: truncateDescription(detail.courseDescription, 300),
    inLanguage: "pt-BR",
    provider: {
      "@type": "CollegeOrUniversity",
      name: detail.school,
      address: {
        "@type": "PostalAddress",
        addressLocality: detail.city,
        addressCountry: "BR",
      },
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: COURSE_MODE[detail.modalidade],
      courseWorkload: detail.duration,
      location: {
        "@type": "Place",
        name: detail.neighborhood,
        address: {
          "@type": "PostalAddress",
          addressLocality: detail.city,
          addressCountry: "BR",
        },
      },
    },
    offers: {
      "@type": "Offer",
      url,
      category: "Bolsa de estudo",
      price: price.toFixed(2),
      priceCurrency: "BRL",
      availability: detail.lastSpots
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: price.toFixed(2),
        priceCurrency: "BRL",
        unitText: "MÊS",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
    },
  };
}

/** FAQ da página de detalhe — elegível a rich result de perguntas frequentes. */
export function faqJsonLd(
  items: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
