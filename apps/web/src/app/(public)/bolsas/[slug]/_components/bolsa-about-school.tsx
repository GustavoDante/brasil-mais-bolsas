import Image from "next/image";

import type { BolsaDetailData } from "@/types/scholarship";

interface BolsaAboutSchoolProps {
  data: BolsaDetailData;
}

export function BolsaAboutSchool({ data }: BolsaAboutSchoolProps) {
  return (
    <section id="conheca-a-escola" className="mt-16 scroll-mt-8">
      <h2 className="text-2xl font-bold text-black lg:text-[32px]">
        Conheça a {data.schoolShortName}
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <p className="max-w-[588px] text-sm font-medium text-black">
          {data.aboutDescription}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 sm:content-start">
            {data.gallery.map((image, index) => (
              <div
                key={image}
                className="relative aspect-[102/75] w-full overflow-hidden rounded-[9px] border border-neutral-200 sm:w-[102px]"
              >
                <Image
                  src={image}
                  alt={`Foto ${index + 1} do campus da ${data.schoolShortName}`}
                  fill
                  sizes="102px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="relative aspect-[466/316] w-full overflow-hidden rounded-[9px] border border-neutral-200 sm:w-[466px]">
            <Image
              src={data.galleryFeatured}
              alt={`Estrutura da ${data.schoolShortName}`}
              fill
              sizes="(max-width: 640px) 100vw, 466px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
