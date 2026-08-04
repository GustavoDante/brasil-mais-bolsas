import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/seo";
import { AboutSection } from "./_components/about-section";
import { CourseSection } from "./_components/course-section";
import { HeroSection } from "./_components/hero-section";
import { PromoSection } from "./_components/promo-section";
import { ScholarshipSection } from "./_components/scholarship-section";
import { SearchPanel } from "./_components/search-panel";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <SearchPanel />
      <ScholarshipSection />
      <PromoSection />
      <AboutSection />
      <CourseSection />
    </main>
  );
}
