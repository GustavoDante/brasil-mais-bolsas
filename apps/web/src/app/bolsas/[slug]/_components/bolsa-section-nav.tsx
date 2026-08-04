"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface BolsaSection {
  id: string;
  label: string;
}

interface BolsaSectionNavProps {
  sections: BolsaSection[];
}

export function BolsaSectionNav({ sections }: BolsaSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    // The section the reader is on is the last one whose top has crossed the
    // upper quarter of the viewport — resolved by position rather than DOM
    // order, since the nav order differs from the page order.
    const syncActiveSection = () => {
      const threshold = window.innerHeight * 0.25;
      let closestTop = Number.NEGATIVE_INFINITY;
      let current = sections[0]?.id;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (!element) continue;

        const { top } = element.getBoundingClientRect();
        if (top <= threshold && top > closestTop) {
          closestTop = top;
          current = section.id;
        }
      }

      setActiveId(current);
    };

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);

    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
    };
  }, [sections]);

  return (
    <nav className="flex flex-wrap items-center gap-3.5">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            "rounded-[9px] px-4 py-3 text-sm font-bold transition-colors",
            activeId === section.id
              ? "bg-brand-blue-700 text-neutral-100"
              : "border border-brand-blue-700 text-brand-blue-800 hover:bg-brand-blue-700/10"
          )}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
