import Image from "next/image";

import { Button } from "@/components/ui/button";
import { SecondaryIcon } from "@/assets/secondary-icon";

function CaretRightCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22ZM10 7L16 12L10 17V7Z" />
    </svg>
  );
}

export function AboutSection() {
  return (
    <section id="sobre" className="w-full bg-white py-12">
      <div className="mx-auto w-full max-w-359 px-4">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-brand-blue-700 to-brand-blue-800 p-6 pb-72 text-white md:overflow-visible md:p-10 md:pb-10 md:min-h-90">
          {/* Text card */}
          <div className="relative z-10 max-w-140 rounded-2xl bg-brand-blue-800 p-6 shadow-[0px_4px_72px_0px_rgba(0,0,0,0.25)] md:p-8">
            <h2 className="text-2xl font-bold md:text-3xl">
              Sobre o Brasil + Bolsas
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-100/90">
              Encontre informações sobre duração do curso, área de atuação,
              mercado de trabalho e muito mais. Compare ofertas, veja notas de
              corte e salário médio e escolha o melhor caminho para a sua
              carreira.
            </p>
          </div>

          {/* Student cutout — pops out above the banner, bottom flush */}
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-64 md:inset-x-auto md:bottom-0 md:right-[15%] md:top-auto md:h-[calc(100%+4.5rem)] md:w-[36%] lg:right-[16%] lg:w-[34%]">
            <Image
              src="/girl.png"
              alt="Estudante do Brasil + Bolsas"
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-contain object-bottom"
            />
          </div>

          {/* Brand logo on the right */}
          <div className="hidden md:absolute md:right-[4%] md:top-[22%] md:block lg:right-[5%]">
            <SecondaryIcon
              variant="colorfull"
              textColor="#FFFFFF"
              width={200}
              height={61}
            />
          </div>

          {/* CTA */}
          <Button className="mt-6 gap-2 rounded-2xl bg-neutral-100 px-6 py-6 text-base font-bold text-brand-blue-800 hover:bg-white md:absolute md:bottom-10 md:right-[4%] md:mt-0 lg:right-[5%]">
            <CaretRightCircleIcon className="size-6" />
            Fale conosco
          </Button>
        </div>
      </div>
    </section>
  );
}
