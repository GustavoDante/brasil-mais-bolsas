import { CalendarCheck, Hourglass } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BolsaDetailData } from "@/types/scholarship";

interface BolsaCourseInfoProps {
  data: BolsaDetailData;
}

export function BolsaCourseInfo({ data }: BolsaCourseInfoProps) {
  return (
    <>
      <section id="o-curso" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-black lg:text-[32px]">
          Informações do curso
        </h2>

        <p className="mt-6 max-w-[680px] text-sm font-medium text-black">
          {data.courseDescription}
        </p>

        <h3 className="mt-12 text-xl font-bold text-black">Detalhes do curso</h3>

        <ul className="mt-6 flex flex-col gap-4 text-sm font-medium text-black sm:flex-row sm:gap-16">
          <li className="flex items-center gap-2">
            <CalendarCheck className="size-4 shrink-0 text-brand-blue-700" />
            Início das aulas previsto: {data.startDate}
          </li>
          <li className="flex items-center gap-2">
            <Hourglass className="size-4 shrink-0 text-brand-blue-700" />
            Duração de {data.duration}
          </li>
        </ul>
      </section>

      <section id="informacoes-importantes" className="mt-14 scroll-mt-8">
        <h3 className="text-xl font-bold text-black">Informações importantes</h3>

        <Accordion
          type="single"
          collapsible
          className="mt-6 max-w-[784px] border-t border-neutral-200"
        >
          {data.faq.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="border-b border-neutral-200"
            >
              <AccordionTrigger className="py-5 text-lg font-semibold text-black hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-[680px] pb-5 text-sm text-neutral-600">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
