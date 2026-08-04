"use client";

import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import { useCarouselState } from "@/hooks/use-carousel-state";

interface CarouselDotsProps {
  api: CarouselApi | undefined;
  className?: string;
}

export function CarouselDots({ api, className }: CarouselDotsProps) {
  const { selectedIndex, scrollSnapCount } = useCarouselState(api);

  if (scrollSnapCount <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: scrollSnapCount }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Ir para o slide ${index + 1}`}
          onClick={() => api?.scrollTo(index)}
          className={
            index === selectedIndex
              ? "h-2.5 w-7 rounded-full bg-brand-blue-800 transition-all"
              : "h-2.5 w-2.5 rounded-full bg-brand-blue-800/25 transition-all hover:bg-brand-blue-800/40"
          }
        />
      ))}
    </div>
  );
}
