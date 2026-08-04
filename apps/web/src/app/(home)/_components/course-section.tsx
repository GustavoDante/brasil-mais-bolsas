"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { courseCategories } from "@/mocks/courses.mock";
import { useCarouselState } from "@/hooks/use-carousel-state";

interface CoursePagerProps {
  api: CarouselApi | undefined;
}

const ELLIPSIS = "ellipsis" as const;

/** Windowed pagination: first, last, current ± siblingCount, with ellipsis for gaps. */
function getPaginationItems(
  current: number,
  total: number,
  siblingCount = 1
): (number | typeof ELLIPSIS)[] {
  const maxVisible = siblingCount * 2 + 5; // first + last + ellipses + siblings + current

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total - 2);
  const showLeftEllipsis = leftSibling > 1;
  const showRightEllipsis = rightSibling < total - 2;

  const items: (number | typeof ELLIPSIS)[] = [0];

  if (showLeftEllipsis) items.push(ELLIPSIS);

  for (let i = leftSibling; i <= rightSibling; i++) items.push(i);

  if (showRightEllipsis) items.push(ELLIPSIS);

  items.push(total - 1);

  return items;
}

function CoursePager({ api }: CoursePagerProps) {
  const { selectedIndex, scrollSnapCount } = useCarouselState(api);

  if (scrollSnapCount <= 1) return null;

  const pages = getPaginationItems(selectedIndex, scrollSnapCount);

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Página anterior"
        onClick={() => api?.scrollPrev()}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-blue-800 text-brand-blue-800 transition-colors hover:bg-brand-blue-800/10"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pages.map((page, i) =>
        page === ELLIPSIS ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-8 w-4 shrink-0 items-center justify-center text-sm text-brand-blue-800"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            aria-label={`Página ${page + 1}`}
            aria-current={page === selectedIndex ? "true" : undefined}
            onClick={() => api?.scrollTo(page)}
            className={
              page === selectedIndex
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue-800 text-sm font-medium text-white"
                : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-blue-800 text-sm font-medium text-brand-blue-800 transition-colors hover:bg-brand-blue-800/10"
            }
          >
            {page + 1}
          </button>
        )
      )}
      <button
        type="button"
        aria-label="Próxima página"
        onClick={() => api?.scrollNext()}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-blue-800 text-brand-blue-800 transition-colors hover:bg-brand-blue-800/10"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CourseSection() {
  const [api, setApi] = useState<CarouselApi>();

  return (
    <section className="w-full bg-white pb-16 pt-6">
      <div className="mx-auto w-full max-w-359 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-brand-blue-800">
              Em dúvida sobre qual curso fazer?
            </h2>
            <p className="text-sm text-brand-blue-700">
              Veja informações sobre duração do curso, área de atuação,
              mercado de trabalho, notas de corte, salário médio e muito mais.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Input
              placeholder="Pesquisar por curso"
              className="border-neutral-200 bg-white"
            />
          </div>
        </div>

        <div className="mt-6">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", slidesToScroll: "auto" }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {courseCategories.map((category) => (
                <CarouselItem
                  key={category.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/6"
                >
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <div className="relative h-80">
                      <Image
                        src={category.image}
                        alt={category.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 16vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 text-sm font-semibold text-brand-blue-700">
                      {category.title}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <CoursePager api={api} />
        </div>
      </div>
    </section>
  );
}
