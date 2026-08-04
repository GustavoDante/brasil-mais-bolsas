"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecondaryIcon } from "@/assets/secondary-icon";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { buildBolsasHref, type BolsasSearch } from "@/lib/search-params";
import type { BolsaModalidade } from "@/types/scholarship";
import {
  bolsasFiltersSchema,
  type BolsasFiltersFormData,
} from "@/schemas/bolsas-filters.schema";

const selectTriggerClassName =
  "h-14 w-full justify-between rounded-lg border-neutral-200 px-6 py-4 text-base font-normal";

interface BolsasFiltersProps {
  /** Estado lido da query string pelo servidor — é a fonte de verdade do formulário. */
  search: BolsasSearch;
  courses: string[];
  colleges: string[];
  cities: string[];
  modalidades: BolsaModalidade[];
}

export function BolsasFilters({
  search,
  courses,
  colleges,
  cities,
  modalidades,
}: BolsasFiltersProps) {
  const router = useRouter();
  const modalidadesKey = search.modalidades.join(",");

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<BolsasFiltersFormData>({
      resolver: zodResolver(bolsasFiltersSchema),
      defaultValues: {
        course: search.course,
        college: search.college,
        city: search.city,
        modalities: search.modalidades,
      },
    });

  // Ressincroniza quando a URL muda por fora do formulário (voltar/avançar do
  // navegador, link compartilhado, clique na paginação).
  useEffect(() => {
    reset({
      course: search.course,
      college: search.college,
      city: search.city,
      modalities: search.modalidades,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.course, search.college, search.city, modalidadesKey, reset]);

  const selectedModalities = watch("modalities") || [];

  const handleModalityToggle = (modalidade: string, checked: boolean) => {
    const next = checked
      ? [...selectedModalities, modalidade]
      : selectedModalities.filter((current) => current !== modalidade);
    setValue("modalities", next, { shouldValidate: true });
  };

  const onSubmit = (data: BolsasFiltersFormData) => {
    const nextSearch = {
      course: data.course ?? "",
      college: data.college ?? "",
      city: data.city ?? "",
      modalidades: (data.modalities ?? []) as BolsaModalidade[],
      // Toda nova busca volta para a primeira página.
      page: 1,
    };

    trackEvent(analyticsEvents.bolsasSearch, {
      curso: nextSearch.course,
      faculdade: nextSearch.college,
      cidade: nextSearch.city,
      modalidade: nextSearch.modalidades.join(","),
      origem: "listagem",
    });

    // `push` (e não `replace`): cada busca vira uma entrada de histórico e uma
    // pageview própria no analytics.
    router.push(buildBolsasHref(nextSearch));
  };

  const handleClear = () => {
    reset({ course: "", college: "", city: "", modalities: [] });
    router.push(buildBolsasHref({}));
  };

  const hasActiveFilters =
    Boolean(search.course || search.college || search.city) ||
    search.modalidades.length > 0;

  return (
    <Card className="rounded-xl border border-neutral-200 shadow-sm ring-0">
      <CardContent className="px-6 py-6 md:px-10">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-base font-semibold text-black">
                Qual curso você pretende estudar?
              </Label>
              <Controller
                control={control}
                name="course"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue placeholder="Filtre por cursos" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-black">
                Prefere alguma faculdade?
              </Label>
              <Controller
                control={control}
                name="college"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue placeholder="Filtre por faculdade" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((college) => (
                        <SelectItem key={college} value={college}>
                          {college}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-black">
                Em que cidade quer estudar?
              </Label>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue placeholder="Recife, PE" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid items-center gap-6 lg:grid-cols-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-semibold text-black">
                Modalidade:
              </span>
              <div className="flex flex-wrap items-center gap-4">
                {modalidades.map((modalidade) => (
                  <label
                    key={modalidade}
                    className="flex cursor-pointer items-center gap-2 text-base font-semibold text-black select-none"
                  >
                    <Checkbox
                      className="size-5 rounded-full"
                      checked={selectedModalities.includes(modalidade)}
                      onCheckedChange={(checked) =>
                        handleModalityToggle(modalidade, checked === true)
                      }
                    />
                    {modalidade}
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              className="h-14 w-full text-2xl font-bold text-neutral-500 hover:bg-neutral-100"
            >
              Buscar por bolsas
            </Button>

            <div className="flex items-center justify-end gap-6 text-brand-blue-900">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClear}
                  className="text-sm font-semibold text-neutral-500 underline hover:bg-transparent"
                >
                  Limpar filtros
                </Button>
              )}
              <div className="hidden lg:block">
                <SecondaryIcon variant="colorfull" width={116.84} height={35.78} />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
