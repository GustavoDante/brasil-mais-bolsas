import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BolsaCardData } from "@/types/scholarship";

interface BolsaCardProps {
  data: BolsaCardData;
}

export function BolsaCard({ data }: BolsaCardProps) {
  const detailHref = `/bolsas/${data.id}`;

  return (
    <Card className="flex flex-col h-full w-full max-w-[345px] gap-0 overflow-hidden rounded-xl border border-neutral-200 py-0 shadow-sm ring-0">
      <div className="relative h-[109px] w-full shrink-0">
        <Image
          src={data.bannerImage}
          alt={data.school}
          fill
          sizes="345px"
          className="object-cover"
        />
        <div className="absolute top-6 left-6 h-[84px] w-32 overflow-hidden rounded-t-lg">
          <Image
            src={data.schoolLogo}
            alt={data.school}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-semibold text-black">{data.school}</p>
          <div className="flex size-[50px] shrink-0 flex-col items-center justify-center rounded-lg border border-brand-green-600 leading-none">
            <span className="text-[10px] font-medium text-brand-green-600">
              Bolsa
            </span>
            <span className="text-base font-extrabold uppercase text-brand-green-600">
              {data.discountPercent}%
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-4">
          <Link
            href={detailHref}
            className="text-2xl font-semibold text-black hover:text-brand-blue-700"
          >
            {data.course}
          </Link>

          <div className="mt-3 flex items-baseline justify-between text-brand-blue-800">
            <p className="text-sm line-through">{data.originalPrice}</p>
            <p className="font-bold">
              <span className="text-[30px] leading-none">
                {data.discountedPrice}
              </span>
              <span className="text-xl leading-none">
                {data.discountedPriceCents}
              </span>
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-neutral-500">Economia total de</p>
            <p className="font-bold text-brand-green-600">
              <span className="text-xl leading-none">
                {data.totalSavings}
              </span>
              <span className="text-sm leading-none">
                {data.totalSavingsCents}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          {data.lastSpots && (
            <div className="mb-2 inline-flex rounded-lg border border-red-500 px-3 py-1">
              <p className="text-xs font-medium text-red-500">
                Últimas bolsas
              </p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-black">
            📍 {data.neighborhood}
            <br />
            🕒 <span className="font-bold">Turno:</span> {data.shift}
            <br />
            🧑‍🏫 <span className="font-bold">Modalidade:</span>{" "}
            {data.modalidade}
            <br />
            📆 <span className="font-bold">Período:</span> {data.period}
          </p>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3">
          <Button
            asChild
            className="h-[49px] w-full justify-center bg-brand-blue-700 text-lg font-bold text-neutral-100 hover:bg-brand-blue-800"
          >
            <Link href={detailHref}>Quero esta bolsa</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-[49px] w-full border-neutral-400 text-base font-normal text-neutral-500 hover:bg-neutral-100"
          >
            <Link href={detailHref}>Ver detalhes</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
