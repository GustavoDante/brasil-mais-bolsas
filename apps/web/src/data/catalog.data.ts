/**
 * Camada de dados de catálogo (cidades, instituições, cursos e categorias).
 * Alimenta os filtros e o painel de busca.
 */
import { api, apiConfig } from "@/lib/api";
import { formatCity } from "@/lib/format";
import { bolsas as mockBolsas } from "@/mocks/bolsas.mock";
import { courseCategories as mockCourseCategories } from "@/mocks/courses.mock";
import type { CityOption, CourseCategoryData, NamedOption } from "@/types/scholarship";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function listCities(): Promise<CityOption[]> {
  if (apiConfig.useMocks) {
    return uniqueSorted(mockBolsas.map((bolsa) => bolsa.city)).map((name) => ({ name }));
  }

  const { cities } = await api.scholarships.listCities();
  return cities.map((city) => ({ name: formatCity(city.name) }));
}

export async function searchCities(term: string): Promise<CityOption[]> {
  if (!term.trim()) return listCities();

  if (apiConfig.useMocks) {
    const normalized = term.toLocaleLowerCase("pt-BR");
    return uniqueSorted(mockBolsas.map((bolsa) => bolsa.city))
      .filter((city) => city.toLocaleLowerCase("pt-BR").includes(normalized))
      .map((name) => ({ name }));
  }

  const { cities } = await api.scholarships.searchCity(term);
  return cities.map((city) => ({ name: formatCity(city.name) }));
}

export async function listInstitutions(city?: string, category?: string): Promise<NamedOption[]> {
  if (apiConfig.useMocks) {
    const filtered = city ? mockBolsas.filter((bolsa) => bolsa.city === city) : mockBolsas;
    return uniqueSorted(filtered.map((bolsa) => bolsa.school)).map((name) => ({ id: name, name }));
  }

  if (city || category) {
    const { institutions } = await api.scholarships.listInstitutionsByCity(
      city ?? "",
      category ?? ""
    );
    return institutions;
  }

  const { institutions } = await api.scholarships.searchInstitution("");
  return institutions;
}

export async function listCourses(city?: string, category?: string): Promise<NamedOption[]> {
  if (apiConfig.useMocks) {
    const filtered = city ? mockBolsas.filter((bolsa) => bolsa.city === city) : mockBolsas;
    return uniqueSorted(filtered.map((bolsa) => bolsa.course)).map((name) => ({ id: name, name }));
  }

  if (city || category) {
    const { courses } = await api.scholarships.listCoursesByCity(city ?? "", category ?? "");
    return courses;
  }

  const { courses } = await api.scholarships.searchCourse("");
  return courses;
}

export async function searchCourses(term: string): Promise<NamedOption[]> {
  if (!term.trim()) return listCourses();

  if (apiConfig.useMocks) {
    const normalized = term.toLocaleLowerCase("pt-BR");
    return uniqueSorted(mockBolsas.map((bolsa) => bolsa.course))
      .filter((course) => course.toLocaleLowerCase("pt-BR").includes(normalized))
      .map((name) => ({ id: name, name }));
  }

  const { courses } = await api.scholarships.searchCourse(term);
  return courses;
}

export async function listCourseCategories(): Promise<CourseCategoryData[]> {
  if (apiConfig.useMocks) return mockCourseCategories;

  const response = await api.courseCategories.list();
  const categories = response.categories ?? response.courseCategories ?? [];

  return categories.map((category) => ({
    id: category.id,
    title: category.name,
    // O backend ainda não guarda imagem por categoria; mantém o placeholder do layout.
    image: "/mock/Rectangle 702.png",
  }));
}
