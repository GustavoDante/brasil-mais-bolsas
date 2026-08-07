import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { BolsaDetailData } from "@/types/scholarship";

interface ResumoBolsaProps {
  bolsa: BolsaDetailData;
  /** Linhas extras do resumo (forma de pagamento, parcelas, status). */
  details?: Array<{ label: string; value: string }>;
}

/** Resumo da oferta — o mesmo card na contratação e na página de agradecimento. */
export function ResumoBolsa({ bolsa, details = [] }: ResumoBolsaProps) {
  return (
    <Card className="w-full gap-0 rounded-xl border border-neutral-200 bg-white p-6 shadow-[0px_4px_34.9px_0px_rgba(0,0,0,0.07)] ring-0">
      <div className="flex items-start gap-4">
        <Image
          src={bolsa.schoolLogo}
          alt={bolsa.school}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-lg object-contain"
        />
        <div className="min-w-0">
          <p className="text-lg font-bold text-black">{bolsa.course}</p>
          <p className="text-sm text-neutral-600">{bolsa.school}</p>
          <p className="text-sm text-neutral-500">
            {bolsa.city} · {bolsa.modalidade} · {bolsa.shift}
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t border-neutral-200 pt-5 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-neutral-600">Mensalidade sem bolsa</dt>
          <dd className="text-neutral-500 line-through">{bolsa.originalPrice}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-semibold text-neutral-700">Com a bolsa</dt>
          <dd className="text-xl font-bold text-brand-blue-800">
            {bolsa.discountedPrice}
            {bolsa.discountedPriceCents}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-neutral-600">Desconto</dt>
          <dd className="font-semibold text-brand-green-600">{bolsa.discountPercent}%</dd>
        </div>

        {details.map((detail) => (
          <div key={detail.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-neutral-600">{detail.label}</dt>
            <dd className="font-semibold text-neutral-800">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
