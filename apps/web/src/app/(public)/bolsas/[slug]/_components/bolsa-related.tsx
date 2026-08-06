"use client";

import { useState } from "react";

import { ScholarshipCard } from "@/components/scholarship-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";
import type { ScholarshipCardData } from "@/types/scholarship";

interface BolsaRelatedProps {
  cards: ScholarshipCardData[];
}

export function BolsaRelated({ cards }: BolsaRelatedProps) {
  const [api, setApi] = useState<CarouselApi>();

  if (cards.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-black lg:text-[32px]">
        Quem viu este curso se interessou também
      </h2>

      <div className="relative mt-8">
        <Carousel setApi={setApi} opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-2 p-1 md:-ml-4">
            {cards.map((card) => (
              <CarouselItem
                key={card.id}
                className="pl-2 md:basis-1/2 md:pl-4 lg:basis-1/4"
              >
                <ScholarshipCard data={card} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden lg:block">
            <CarouselPrevious className="-left-12 border-neutral-200 bg-white text-brand-blue-800" />
            <CarouselNext className="-right-12 border-neutral-200 bg-white text-brand-blue-800" />
          </div>
        </Carousel>

        <CarouselDots api={api} className="mt-6" />
      </div>
    </section>
  );
}
