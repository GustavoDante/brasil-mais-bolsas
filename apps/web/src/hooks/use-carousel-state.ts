"use client";

import { useEffect, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

export function useCarouselState(api: CarouselApi | undefined) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnapCount, setScrollSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelectOrReInit = () => {
      setScrollSnapCount(api.scrollSnapList().length);
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelectOrReInit();
    api.on("select", onSelectOrReInit);
    api.on("reInit", onSelectOrReInit);

    return () => {
      api.off("select", onSelectOrReInit);
      api.off("reInit", onSelectOrReInit);
    };
  }, [api]);

  return { selectedIndex, scrollSnapCount };
}
