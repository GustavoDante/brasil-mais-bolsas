import Image from "next/image";
import { MapPin } from "lucide-react";

import type { BolsaDetailData } from "@/types/scholarship";

interface BolsaLocationProps {
  data: BolsaDetailData;
}

export function BolsaLocation({ data }: BolsaLocationProps) {
  return (
    <section id="o-campus" className="mt-16 scroll-mt-8">
      <h2 className="text-2xl font-bold text-black lg:text-[32px]">
        Onde fica a {data.school}?
      </h2>

      <p className="mt-6 flex items-center gap-2 text-sm text-black">
        <MapPin className="size-4 shrink-0 text-brand-blue-700" />
        {data.neighborhood}
      </p>

      <div className="relative mt-4 h-[220px] w-full overflow-hidden rounded-[9px] border border-neutral-200 lg:h-[350px]">
        <Image
          src={data.mapImage}
          alt={`Mapa da localização da ${data.school}`}
          fill
          sizes="(max-width: 1024px) 100vw, 1440px"
          className="object-cover"
        />
      </div>
    </section>
  );
}
