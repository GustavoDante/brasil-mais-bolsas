import type { Metadata } from "next";

import { listCities, listCourseCategories, listCourses } from "@/data/catalog.data";
import { listScholarshipCards } from "@/data/scholarships.data";
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

/**
 * Uma requisição que falhar não pode derrubar a home inteira: a seção sem dados
 * simplesmente não aparece.
 */
async function safeList<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

export default async function Home() {
  const [cards, cities, courses, categories] = await Promise.all([
    safeList(listScholarshipCards),
    safeList(listCities),
    safeList(listCourses),
    safeList(listCourseCategories),
  ]);

  return (
    <main className="flex-1">
      <HeroSection />
      <SearchPanel categories={categories} />
      <ScholarshipSection cards={cards} cities={cities} />
      <PromoSection />
      <AboutSection />
      <CourseSection courses={courses} />
    </main>
  );
}
