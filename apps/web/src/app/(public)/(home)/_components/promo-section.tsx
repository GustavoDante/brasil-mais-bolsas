"use client";

import { useState } from "react";
import { ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SecondaryIcon } from "@/assets/secondary-icon";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";

const variantStyles = {
  blue: "bg-brand-blue-800 text-white",
  green: "bg-[#009D2E] text-white",
} as const;

interface PromoCard {
  id: string;
  title: string;
  highlight: string;
  discount: string;
  variant: keyof typeof variantStyles;
}

/**
 * Peças de campanha da home. Não vêm da API: a API guarda bolsas, não banner — o texto
 * é editorial e muda com a campanha, não com o catálogo. Quando existir um CMS, é este
 * array que sai daqui.
 */
const promoCards: PromoCard[] = [
  {
    id: "promo-blue-1",
    title: "Boleto ou cartão de crédito à vista ou parcelado",
    highlight: "Contrate a sua bolsa",
    discount: "70% OFF",
    variant: "blue",
  },
  {
    id: "promo-green-1",
    title: "Boleto ou cartão de crédito à vista ou parcelado",
    highlight: "Garanta até 70% de desconto",
    discount: "70% OFF",
    variant: "green",
  },
  {
    id: "promo-blue-2",
    title: "Desconto especial para novos alunos",
    highlight: "Matrícula com desconto",
    discount: "50% OFF",
    variant: "blue",
  },
  {
    id: "promo-green-2",
    title: "Bolsas de estudo para Ensino Fundamental e Médio",
    highlight: "Garanta sua vaga",
    discount: "60% OFF",
    variant: "green",
  },
  {
    id: "promo-blue-3",
    title: "Condições exclusivas para mensalidades do ano letivo",
    highlight: "Economize todo mês",
    discount: "75% OFF",
    variant: "blue",
  },
];

export function PromoSection() {
  const [api, setApi] = useState<CarouselApi>();

  return (
    <section className="w-full bg-white py-6">
      <div className="mx-auto w-full max-w-359 px-4">
        <Carousel setApi={setApi} opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-4 p-1">
            {promoCards.map((promo) => {
              const [percent, ...rest] = promo.discount.split(" ");
              const suffix = rest.join(" ");

              return (
                <CarouselItem key={promo.id} className="pl-4 lg:basis-1/2">
                  <Card
                    className={`relative overflow-hidden border-none p-6 md:p-8 flex h-full flex-row items-center justify-between gap-4 rounded-2xl ${variantStyles[promo.variant]}`}
                  >
                    <div className="flex flex-col gap-3 md:gap-4 max-w-[65%]">
                      <p className="text-[10px] md:text-xs font-semibold uppercase text-white/90 leading-tight">
                        Selecione uma bolsa disponível e contrate direto pelo site, pagando com:
                      </p>
                      <h3 className="text-xl md:text-3xl font-black uppercase leading-tight text-white">
                        {promo.title}
                      </h3>
                      <div className="mt-2 md:mt-4">
                        <Button className="bg-white text-brand-blue-800 font-bold hover:bg-neutral-100 rounded-xl h-11 px-4 md:px-6 flex items-center gap-2 shadow-sm">
                          <ArrowRightCircle className="h-5 w-5" />
                          <span className="hidden sm:inline">{promo.highlight}</span>
                          <span className="sm:hidden">Contrate</span>
                        </Button>
                      </div>
                    </div>

                    <div className="fshrink-0">
                      <div
                        className={`rounded-xl overflow-hidden shadow-lg flex flex-col ${
                          promo.variant === "blue" ? "bg-white" : "bg-[#FFB000]"
                        }`}
                      >
                        <div className="p-3 md:p-5 text-center text-brand-blue-800">
                          <span className="text-[10px] md:text-xs font-bold block text-right">
                            Até
                          </span>
                          <span className="text-4xl md:text-6xl font-black block leading-[0.85] tracking-tighter">
                            {percent}
                            <br />
                            <span className="text-3xl md:text-5xl">{suffix}</span>
                          </span>
                        </div>
                        <div
                          className={`p-2 flex justify-center items-center h-10 ${
                            promo.variant === "blue"
                              ? "bg-[#009D2E]"
                              : "bg-brand-blue-800"
                          }`}
                        >
                          {promo.variant === "blue" ? (
                            <SecondaryIcon
                              variant="monocolor"
                              textColor="#FFFFFF"
                              width={90}
                              height={24}
                            />
                          ) : (
                            <SecondaryIcon
                              variant="monocolor-inverted"
                              textColor="#FFB000"
                              width={90}
                              height={24}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <CarouselDots api={api} className="mt-6" />
      </div>
    </section>
  );
}
