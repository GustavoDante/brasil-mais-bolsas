/**
 * Camada de dados de catálogo (cidades, instituições, cursos e categorias).
 * Alimenta os filtros e o painel de busca.
 */
import { api } from "@/lib/api";
import { formatCity } from "@/lib/format";
import type { CityOption, NamedOption } from "@/types/scholarship";

/**
 * O catálogo cadastra o mesmo curso uma vez por instituição: "NUTRIÇÃO" existe dezenas
 * de vezes, com ids diferentes. O mesmo vale para nomes de instituição repetidos entre
 * unidades. Como os filtros da listagem casam por **nome** (`course.name contains`),
 * esses registros são a mesma opção — e deixá-los passar dá `<SelectItem>` com value
 * repetido (a seleção fica ambígua) e URLs duplicadas no sitemap.
 */
function uniqueByName<T extends { name: string }>(options: T[]): T[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = option.name.trim().toLocaleLowerCase("pt-BR");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function listCities(): Promise<CityOption[]> {
  const { cities } = await api.scholarships.listCities();
  return uniqueByName(cities.map((city) => ({ name: formatCity(city.name) })));
}

export async function searchCities(term: string): Promise<CityOption[]> {
  if (!term.trim()) return listCities();

  const { cities } = await api.scholarships.searchCity(term);
  return uniqueByName(cities.map((city) => ({ name: formatCity(city.name) })));
}

export async function listInstitutions(city?: string, category?: string): Promise<NamedOption[]> {
  if (city || category) {
    const { institutions } = await api.scholarships.listInstitutionsByCity(
      city ?? "",
      category ?? ""
    );
    return uniqueByName(institutions);
  }

  const { institutions } = await api.scholarships.searchInstitution("");
  return uniqueByName(institutions);
}

export async function listCourses(city?: string, category?: string): Promise<NamedOption[]> {
  if (city || category) {
    const { courses } = await api.scholarships.listCoursesByCity(city ?? "", category ?? "");
    return uniqueByName(courses);
  }

  const { courses } = await api.scholarships.searchCourse("");
  return uniqueByName(courses);
}

export async function searchCourses(term: string): Promise<NamedOption[]> {
  if (!term.trim()) return listCourses();

  const { courses } = await api.scholarships.searchCourse(term);
  return uniqueByName(courses);
}

/**
 * Categorias de curso (FACULDADES, PÓS-GRADUAÇÃO, ESCOLAS, ...) — são as mesmas que a
 * listagem aceita no filtro `category`, casadas por nome.
 */
export async function listCourseCategories(): Promise<NamedOption[]> {
  const response = await api.courseCategories.list();
  const categories = response.categories ?? response.courseCategories ?? [];

  return categories.map((category) => ({ id: category.id, name: category.name }));
}
