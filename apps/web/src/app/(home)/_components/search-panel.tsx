"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchPanelSchema, type SearchPanelFormData } from "@/schemas/search-panel.schema";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { BOLSA_MODALIDADES, buildBolsasHref } from "@/lib/search-params";
import type { BolsaModalidade } from "@/types/scholarship";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  GraduationCap,
  School,
  Wrench,
  Monitor,
  BookOpen,
  MessageSquare,
  Pen,
  Bookmark,
  CheckCircle2,
  Circle
} from "lucide-react";
import { SecondaryIcon } from "@/assets/secondary-icon";

const modalitiesList = ["Presencial", "Semi", "EaD"] as const;

const categoriesList = [
  { label: "Faculdades", icon: GraduationCap },
  { label: "Pós-Graduação", icon: Briefcase },
  { label: "Escolas", icon: School },
  { label: "Cursos Livres", icon: Monitor },
  { label: "Técnico", icon: Wrench },
  { label: "Preparatórios", icon: BookOpen },
  { label: "Idiomas", icon: MessageSquare },
  { label: "EJA", icon: Pen },
  { label: "Pré-Vestibular", icon: Bookmark },
];

export function SearchPanel() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SearchPanelFormData>({
    resolver: zodResolver(searchPanelSchema),
    defaultValues: {
      category: "Faculdades",
      course: "",
      college: "",
      city: "",
      modalities: ["Presencial", "Semi", "EaD"],
    },
  });

  const selectedCategory = watch("category");
  const selectedModalities = watch("modalities") || [];

  /**
   * A busca da home entra na mesma query string de `/bolsas` (ver `lib/search-params`),
   * então o filtro escolhido aqui já chega preenchido na listagem, é compartilhável e
   * aparece no analytics com exatamente os mesmos nomes de parâmetro.
   *
   * `category` ainda não é um parâmetro da listagem — segue só como dimensão do evento
   * até a API expor o filtro por categoria.
   */
  const onSubmit = (data: SearchPanelFormData) => {
    const modalidades = (data.modalities ?? []).filter((modality): modality is BolsaModalidade =>
      (BOLSA_MODALIDADES as string[]).includes(modality)
    );

    trackEvent(analyticsEvents.bolsasSearch, {
      curso: data.course,
      faculdade: data.college,
      cidade: data.city,
      modalidade: modalidades.join(","),
      categoria: data.category,
      origem: "home",
    });

    router.push(
      buildBolsasHref({
        course: data.course,
        college: data.college,
        city: data.city,
        modalidades,
      })
    );
  };

  const handleCategoryClick = (label: string) => {
    setValue("category", label, { shouldValidate: true });
  };

  const handleModalityToggle = (modality: string) => {
    const newModalities = selectedModalities.includes(modality)
      ? selectedModalities.filter((m) => m !== modality)
      : [...selectedModalities, modality];
    setValue("modalities", newModalities, { shouldValidate: true });
  };

  return (
    <section className="relative -mt-52 w-full pb-10">
      <div className="mx-auto w-full max-w-[1436px] px-4">
        <Card className="relative overflow-visible rounded-2xl rounded-tl-none border-neutral-200 shadow-xl bg-neutral-100">
          <div className="absolute -top-9 z-10 left-0 rounded-t-2xl bg-neutral-100 px-6 py-2.5 text-xs font-bold text-brand-blue-700 shadow-sm">
            <h2>O que deseja estudar?</h2>
          </div>
          <CardContent className="px-8 pb-8 pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6 sm:grid sm:grid-cols-3 lg:flex lg:flex-nowrap">
                  {categoriesList.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.label;

                    return (
                      <div
                        key={category.label}
                        onClick={() => handleCategoryClick(category.label)}
                        className="flex flex-col items-center gap-2 text-center whitespace-nowrap flex-1 cursor-pointer group"
                      >
                        <div
                          className={
                            isActive
                              ? "flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-800 text-white shadow-md transition-transform hover:scale-105"
                              : "flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-blue-800 shadow-sm transition-all hover:scale-105 group-hover:shadow-md"
                          }
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span
                          className={
                            isActive
                              ? "rounded-md bg-brand-blue-800 px-3 py-1 text-xs font-bold text-white shadow-sm"
                              : "rounded-md px-2 py-1 text-xs font-semibold text-brand-blue-800 transition-colors group-hover:bg-white group-hover:shadow-sm"
                          }
                        >
                          {category.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {errors.category && (
                  <p className="mt-2 text-sm font-semibold text-red-500">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-brand-blue-900">
                    Qual curso você pretende estudar?
                  </Label>
                  <Input
                    {...register("course")}
                    placeholder="Filtre por cursos"
                    className="border-neutral-300 bg-white h-11 text-sm shadow-sm"
                  />
                  {errors.course && (
                    <p className="text-xs font-semibold text-red-500">
                      {errors.course.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-brand-blue-900">
                    Prefere alguma faculdade?
                  </Label>
                  <Input
                    {...register("college")}
                    placeholder="Filtre por faculdade"
                    className="border-neutral-300 bg-white h-11 text-sm shadow-sm"
                  />
                  {errors.college && (
                    <p className="text-xs font-semibold text-red-500">
                      {errors.college.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-brand-blue-900">
                    Em que cidade quer estudar?
                  </Label>
                  <Input
                    {...register("city")}
                    placeholder="Recife, PE"
                    className="border-neutral-300 bg-white h-11 text-sm shadow-sm"
                  />
                  {errors.city && (
                    <p className="text-xs font-semibold text-red-500">
                      {errors.city.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 gap-6 grid grid-cols-1 items-center lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-bold text-brand-blue-900">
                      Modalidade:
                    </span>
                    <div className="flex flex-wrap items-center gap-5">
                      {modalitiesList.map((modality) => {
                        const isChecked = selectedModalities.includes(modality);

                        return (
                          <div
                            key={modality}
                            onClick={() => handleModalityToggle(modality)}
                            className="flex items-center gap-2 text-sm font-bold text-brand-blue-900 cursor-pointer select-none"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="h-5 w-5 fill-brand-blue-700 text-white" />
                            ) : (
                              <Circle className="h-5 w-5 text-neutral-400" />
                            )}
                            {modality}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {errors.modalities && (
                    <p className="text-sm font-semibold text-red-500">
                      {errors.modalities.message}
                    </p>
                  )}
                </div>



                <div className="hidden lg:flex lg:justify-center text-brand-blue-900">
                  <SecondaryIcon variant="monocolor" width={116.84} height={35.78} />
                </div>

                <Button type="submit" className="h-12 px-12 bg-brand-blue-800 text-base font-bold text-white hover:bg-brand-blue-900 shadow-md transition-all hover:scale-105">
                  Buscar por bolsas
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
