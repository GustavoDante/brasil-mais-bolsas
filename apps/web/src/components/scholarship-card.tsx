import Image from "next/image";
import { ArrowRightCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ScholarshipCardData } from "@/types/scholarship";

interface ScholarshipCardProps {
  data: ScholarshipCardData;
}

export function ScholarshipCard({ data }: ScholarshipCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-sm flex flex-col gap-0 py-0 h-full bg-neutral-100">
      <div className="bg-brand-blue-800 px-4 py-4 text-white flex items-center justify-between">
        <div className="text-sm tracking-wide text-neutral-100 max-w-25 leading-tight">
          Descontos de até:
        </div>
        <div className="text-4xl font-normal tracking-tight">{data.discount}</div>
      </div>
      <div className="relative h-40 w-full">
        <Image
          src={data.image}
          alt={data.school}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <CardContent className="flex flex-col flex-1 space-y-4 p-5">
        <p className="text-base font-medium uppercase text-brand-blue-800 flex-1">
          {data.school}
        </p>
        <div className="h-px bg-neutral-300 w-full" />
        <p className="text-sm font-medium text-brand-blue-800">
          A partir de: <span className="font-bold">{data.priceFrom}</span>
        </p>
        <Button className="w-full bg-brand-blue-800 text-white font-bold hover:bg-brand-blue-900 shadow-md h-11 flex justify-start pl-4">
          <ArrowRightCircle className="mr-2 h-5 w-5 fill-white text-brand-blue-800" />
          Ver bolsas
        </Button>
      </CardContent>
    </Card>
  );
}
