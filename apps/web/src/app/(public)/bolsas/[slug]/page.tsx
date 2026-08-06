import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import {
  getBolsaDetail,
  listBolsaIds,
  listScholarshipCards,
} from "@/data/scholarships.data";
import { buildBolsasHref } from "@/lib/search-params";
import { absoluteUrl, truncateDescription } from "@/lib/seo";
import {
  bolsaCourseJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/lib/structured-data";
import { BolsaAboutSchool } from "./_components/bolsa-about-school";
import { BolsaBreadcrumb } from "./_components/bolsa-breadcrumb";
import { BolsaCourseInfo } from "./_components/bolsa-course-info";
import { BolsaHero } from "./_components/bolsa-hero";
import { BolsaLocation } from "./_components/bolsa-location";
import { BolsaOfferCard } from "./_components/bolsa-offer-card";
import { BolsaRelated } from "./_components/bolsa-related";
import { BolsaSectionNav } from "./_components/bolsa-section-nav";

interface BolsaDetailPageProps {
  params: Promise<{ slug: string }>;
}

/** `cache` evita buscar o mesmo detalhe duas vezes (metadata + página). */
const loadBolsaDetail = cache(getBolsaDetail);

/**
 * Quantas páginas de detalhe entram no build. O catálogo real passa de 2,5 mil bolsas —
 * pré-renderizar todas custa um build longo para páginas que quase nunca são acessadas.
 * As demais são geradas sob demanda no primeiro acesso e ficam em cache (ISR), então o
 * buscador continua recebendo HTML estático; só a primeira visita paga a renderização.
 */
const PRERENDERED_DETAILS = 200;

export async function generateStaticParams() {
  const ids = await listBolsaIds();
  return ids.slice(0, PRERENDERED_DETAILS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BolsaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await loadBolsaDetail(slug);

  if (!detail) {
    return { title: "Bolsa não encontrada", robots: { index: false, follow: false } };
  }

  const title = `${detail.title} — bolsa de ${detail.discountPercent}% de desconto`;
  const description = truncateDescription(
    `${detail.course} ${detail.modalidade} na ${detail.school} em ${detail.city}. Mensalidade de ${detail.discountedPrice}${detail.discountedPriceCents} com ${detail.discountPercent}% de bolsa. ${detail.courseDescription}`
  );
  const canonical = absoluteUrl(`/bolsas/${detail.id}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: [{ url: detail.bannerImage, alt: `${detail.course} — ${detail.school}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [detail.bannerImage],
    },
  };
}

export default async function BolsaDetailPage({ params }: BolsaDetailPageProps) {
  const { slug } = await params;
  const detail = await loadBolsaDetail(slug);

  if (!detail) {
    notFound();
  }

  // A vitrine é um extra da página: se a chamada falhar, a seção some, o detalhe fica.
  const relatedCards = await listScholarshipCards().catch(() => []);

  const sections = [
    { id: "o-curso", label: "O Curso" },
    { id: "o-campus", label: "O Campus" },
    { id: "conheca-a-escola", label: `Conheça a ${detail.schoolShortName}` },
    { id: "informacoes-importantes", label: "Informações importantes" },
  ];

  /**
   * Trilha com links reais: cada nível aponta para a listagem já filtrada, o que
   * distribui autoridade para as facetas indexáveis e dá ao usuário um caminho de volta.
   */
  const breadcrumb = [
    { label: "Bolsas de estudo", href: "/bolsas" },
    {
      label: detail.city,
      href: buildBolsasHref({ city: detail.city }),
    },
    {
      label: detail.schoolShortName,
      href: buildBolsasHref({ college: detail.school }),
    },
    { label: detail.course },
  ];

  return (
    <main className="w-full bg-neutral-100 pt-8 pb-16">
      <JsonLd
        data={[
          bolsaCourseJsonLd(detail),
          breadcrumbJsonLd([
            { name: "Início", path: "/" },
            ...breadcrumb
              .filter((item) => item.href)
              .map((item) => ({ name: item.label, path: item.href as string })),
            { name: detail.course, path: `/bolsas/${detail.id}` },
          ]),
          ...(detail.faq.length > 0 ? [faqJsonLd(detail.faq)] : []),
        ]}
      />

      <div className="mx-auto w-full max-w-359 px-4">
        <BolsaBreadcrumb items={breadcrumb} />

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 flex-1">
            <BolsaHero data={detail} />
            <div className="mt-8">
              <BolsaSectionNav sections={sections} />
            </div>
          </div>

          <div className="w-full shrink-0 lg:max-w-[467px]">
            <BolsaOfferCard data={detail} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[1612px] px-4">
        <div className="rounded-[9px] bg-white py-10 lg:py-14">
          <div className="mx-auto w-full max-w-359 px-4">
            <BolsaCourseInfo data={detail} />
            <BolsaLocation data={detail} />
            <BolsaAboutSchool data={detail} />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-359 px-4">
        <BolsaRelated cards={relatedCards} />
      </div>
    </main>
  );
}
