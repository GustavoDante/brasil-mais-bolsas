import Image from "next/image";
import { CalendarDays, Clock, GraduationCap, MapPin } from "lucide-react";

import type { BolsaDetailData } from "@/types/scholarship";

interface BolsaHeroProps {
  data: BolsaDetailData;
}

export function BolsaHero({ data }: BolsaHeroProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="relative h-[120px] w-[150px] shrink-0 overflow-hidden rounded-[9px] bg-white">
        <Image
          src={data.schoolLogo}
          alt={data.school}
          fill
          sizes="150px"
          className="object-contain p-2"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="max-w-[737px] text-2xl font-bold text-black lg:text-[32px] lg:leading-tight">
          {data.title}
        </h1>

        <ul className="mt-4 space-y-1.5 text-sm text-black">
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-brand-blue-700" />
            {data.neighborhood}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand-blue-700" />
            <span className="font-bold">Turno:</span> {data.shift}
          </li>
          <li className="flex items-center gap-2">
            <GraduationCap className="size-4 shrink-0 text-brand-blue-700" />
            <span className="font-bold">Modalidade:</span> {data.modalidade}
          </li>
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-brand-blue-700" />
            <span className="font-bold">Período:</span> {data.period}
          </li>
        </ul>
      </div>
    </div>
  );
}
