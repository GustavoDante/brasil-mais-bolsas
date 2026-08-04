/**
 * Verificação da integração com a API real.
 *
 * Executa a camada de dados (`src/data`) com os mocks desligados e imprime o que a UI
 * receberia. É a forma rápida de conferir se um endpoint mudou de formato sem precisar
 * abrir o site.
 *
 * Uso (com a API rodando):
 *   npx tsx scripts/check-api-integration.ts
 *   NEXT_PUBLIC_API_URL=https://api.exemplo.com npx tsx scripts/check-api-integration.ts
 */
// Precisa vir antes de qualquer import da aplicação: `apiConfig` lê o ambiente no load.
// Por isso os módulos abaixo entram por import dinâmico, não estático.
process.env.NEXT_PUBLIC_USE_MOCKS = "false";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3333";

async function main(): Promise<void> {
  const { listCities, listCourseCategories, listCourses, listInstitutions } = await import(
    "../src/data/catalog.data"
  );
  const { listFaq } = await import("../src/data/faq.data");
  const { getBolsaDetail, listBolsas, listBolsasDestaque, listScholarshipCards } = await import(
    "../src/data/scholarships.data"
  );
  const { apiConfig } = await import("../src/lib/api/config");

  const checks: { label: string; run: () => Promise<unknown> }[] = [
    { label: "listBolsas()", run: () => listBolsas() },
    { label: "listBolsasDestaque()", run: () => listBolsasDestaque() },
    { label: "listScholarshipCards()", run: () => listScholarshipCards() },
    { label: "listCities()", run: () => listCities() },
    { label: "listInstitutions()", run: () => listInstitutions() },
    { label: "listCourses()", run: () => listCourses() },
    { label: "listCourseCategories()", run: () => listCourseCategories() },
    { label: "listFaq()", run: () => listFaq() },
  ];

  console.log(`API: ${apiConfig.baseUrl}${apiConfig.prefix} | mocks: ${apiConfig.useMocks}\n`);

  if (apiConfig.useMocks) {
    console.log("Mocks continuam ligados — o teste não valida a API. Abortando.");
    process.exitCode = 1;
    return;
  }

  let failures = 0;

  for (const check of checks) {
    try {
      const result = await check.run();
      const count = Array.isArray(result) ? result.length : 1;
      const sample = Array.isArray(result) ? result[0] : result;
      console.log(`✓ ${check.label} — ${count} item(s)`);
      if (sample) console.log(`   ${JSON.stringify(sample)}\n`);
    } catch (error) {
      failures += 1;
      console.log(`✗ ${check.label} — ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Detalhe depende de um id existente: usa o primeiro da listagem.
  try {
    const [first] = await listBolsas();
    if (first) {
      const detail = await getBolsaDetail(first.id);
      console.log(`✓ getBolsaDetail("${first.id}") — ${detail ? "ok" : "não encontrado"}`);
      if (detail) {
        console.log(
          `   ${JSON.stringify({
            title: detail.title,
            duration: detail.duration,
            startDate: detail.startDate,
            faq: detail.faq.length,
          })}\n`
        );
      }
    }
  } catch (error) {
    failures += 1;
    console.log(`✗ getBolsaDetail — ${error instanceof Error ? error.message : String(error)}\n`);
  }

  console.log(failures === 0 ? "Integração OK" : `${failures} verificação(ões) falharam`);
  process.exitCode = failures === 0 ? 0 : 1;
}

void main();
