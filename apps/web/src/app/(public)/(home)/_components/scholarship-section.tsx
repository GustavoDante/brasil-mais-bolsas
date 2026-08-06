"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SecondaryIcon } from "@/assets/secondary-icon";
import { buildBolsasHref } from "@/lib/search-params";
import type { CityOption, ScholarshipCardData } from "@/types/scholarship";

interface ScholarshipSectionProps {
  /** Vitrine de `GET /scholarships/list/index`: instituições, não bolsas. */
  cards: ScholarshipCardData[];
  /** Cidades que realmente têm bolsa ativa (`GET /scholarships/list/city`). */
  cities: CityOption[];
}

export function ScholarshipSection({ cards, cities }: ScholarshipSectionProps) {
  const router = useRouter();
  const [city, setCity] = useState(() => cities[0]?.name ?? "");
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  const cityNames = useMemo(() => cities.map((option) => option.name), [cities]);

  /**
   * Sugere a cidade do visitante, mas só quando ela existe no catálogo — mandar alguém
   * para uma listagem vazia é pior do que começar pela primeira cidade com bolsas.
   */
  useEffect(() => {
    if (cityNames.length === 0) return;

    const controller = new AbortController();

    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { city?: string }) => {
        const guess = data.city?.trim().toLocaleLowerCase("pt-BR");
        if (!guess) return;

        const match = cityNames.find(
          (name) => name.toLocaleLowerCase("pt-BR") === guess
        );
        if (match) setCity(match);
      })
      .catch(() => {
        // Geolocalização é só conveniência: sem ela, fica a cidade padrão.
      });

    return () => controller.abort();
  }, [cityNames]);

  if (cards.length === 0) return null;

  const handleCitySelect = (name: string) => {
    setCity(name);
    setOpen(false);
    router.push(buildBolsasHref({ city: name }));
  };

  return (
    <section className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-[1436px] px-4 lg:px-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-blue-800">
              Bolsas interessantes para você
            </h2>
            <div className="flex items-center gap-1 text-xs md:text-sm text-brand-blue-700 mt-1">
              <span>
                Mostrando {cards.length}{" "}
                {cards.length === 1 ? "instituição" : "instituições"}. Ver bolsas em
              </span>

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    disabled={cityNames.length === 0}
                    className="h-auto p-0 font-bold text-brand-blue-800 hover:text-brand-blue-900 hover:bg-transparent px-1 gap-1"
                  >
                    {city || "escolher cidade"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cidade..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                      <CommandGroup>
                        {cityNames.map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={() => handleCitySelect(name)}
                          >
                            <MapPin className="mr-2 h-4 w-4 text-neutral-500" />
                            {name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="hidden md:block">
            <SecondaryIcon variant="colorfull" width={182} height={56} />
          </div>
        </div>

        <div className="mt-8 relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 p-1 md:-ml-4">
              {cards.map((card) => (
                <CarouselItem
                  key={card.id}
                  className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4"
                >
                  <ScholarshipCard data={card} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden lg:block">
              <CarouselPrevious className="-left-12 bg-white text-brand-blue-800 border-neutral-200" />
              <CarouselNext className="-right-12 bg-white text-brand-blue-800 border-neutral-200" />
            </div>
          </Carousel>

          <CarouselDots api={api} className="mt-6" />
        </div>
      </div>
    </section>
  );
}
