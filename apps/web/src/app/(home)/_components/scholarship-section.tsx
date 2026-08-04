"use client";

import { useEffect, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scholarshipCards } from "@/mocks/scholarships.mock";
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

interface City {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      };
    };
  } | null;
}

export function ScholarshipSection() {
  const [location, setLocation] = useState("Caruaru, PE");
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.city && data.region_code) {
          setLocation(`${data.city}, ${data.region_code}`);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch IP location:", err);
      });
  }, []);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
      .then((res) => res.json())
      .then((data: City[]) => {
        const formatted = data
          .filter((city) => city.microrregiao?.mesorregiao?.UF?.sigla)
          .map((city) => {
            const uf = city.microrregiao!.mesorregiao.UF.sigla;
            return {
              label: `${city.nome}, ${uf}`,
              value: `${city.nome}, ${uf}`,
            };
          });
        setCities(formatted);
      })
      .catch((err) => console.error("Failed to fetch cities:", err));
  }, []);

  return (
    <section className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-[1436px] px-4 lg:px-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-brand-blue-800">
              Bolsas interessantes para você
            </h2>
            <div className="flex items-center gap-1 text-xs md:text-sm text-brand-blue-700 mt-1">
              <span>Mostrando 10 perto de</span>

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="h-auto p-0 font-bold text-brand-blue-800 hover:text-brand-blue-900 hover:bg-transparent px-1 gap-1"
                  >
                    {location}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cidade..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((city) => (
                          <CommandItem
                            key={city.value}
                            value={city.value}
                            onSelect={(currentValue) => {
                              const original =
                                cities.find(
                                  (c) =>
                                    c.value.toLowerCase() ===
                                    currentValue.toLowerCase()
                                )?.label || city.label;
                              setLocation(original);
                              setOpen(false);
                            }}
                          >
                            <MapPin className="mr-2 h-4 w-4 text-neutral-500" />
                            {city.label}
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
              {scholarshipCards.map((card) => (
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
