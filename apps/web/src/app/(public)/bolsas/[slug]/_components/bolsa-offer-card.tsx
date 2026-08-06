import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BolsaDetailData } from "@/types/scholarship";

interface BolsaOfferCardProps {
  data: BolsaDetailData;
}

export function BolsaOfferCard({ data }: BolsaOfferCardProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-neutral-200 bg-white p-7 shadow-[0px_4px_34.9px_0px_rgba(0,0,0,0.07)] ring-0">
      <div className="flex items-start justify-between gap-4">
        <p className="text-2xl font-bold text-black">{data.title}</p>
        <div className="flex size-[68px] shrink-0 flex-col items-center justify-center rounded-xl border border-brand-green-600 leading-none">
          <span className="text-[13px] font-medium text-brand-green-600">
            Bolsa
          </span>
          <span className="mt-1 text-[22px] font-extrabold uppercase text-brand-green-600">
            {data.discountPercent}%
          </span>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-xl text-neutral-700">Mensalidade:</p>
        <p className="mt-1 text-lg text-brand-blue-800 line-through">
          {data.originalPrice}
        </p>
        <p className="font-bold text-brand-blue-800">
          <span className="text-[40px] leading-none">{data.discountedPrice}</span>
          <span className="text-[27px] leading-none">
            {data.discountedPriceCents}
          </span>
        </p>
      </div>

      <div className="mt-8">
        <p className="text-xl text-neutral-700">Economia total de</p>
        <p className="font-bold text-brand-green-600">
          <span className="text-[40px] leading-none">{data.totalSavings}</span>
          <span className="text-[27px] leading-none">
            {data.totalSavingsCents}
          </span>
        </p>
      </div>

      <Button className="mt-9 h-[66px] w-full justify-center rounded-xl bg-brand-blue-700 text-2xl font-bold text-neutral-100 hover:bg-brand-blue-800">
        Quero esta bolsa
      </Button>
    </Card>
  );
}
