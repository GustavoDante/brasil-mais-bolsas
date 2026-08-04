/** Camada de dados do FAQ. */
import { api, apiConfig } from "@/lib/api";
import type { BolsaFaqItem } from "@/types/scholarship";

/** Perguntas usadas na página de detalhe enquanto a API não é ligada. */
const mockFaq: BolsaFaqItem[] = [
  {
    question: "Condições especiais da faculdade",
    answer:
      "A bolsa é válida para novos alunos que ainda não possuem vínculo com a instituição. O desconto incide sobre a mensalidade cheia e não é cumulativo com outros programas de financiamento.",
  },
  {
    question: "O desconto é até o final do curso?",
    answer:
      "Sim. O percentual contratado se mantém do primeiro ao último semestre, desde que a matrícula seja renovada em dia e o aluno permaneça no mesmo curso, turno e unidade.",
  },
];

export async function listFaq(): Promise<BolsaFaqItem[]> {
  if (apiConfig.useMocks) return mockFaq;

  const response = await api.faq.list();
  const items = response.faqs ?? response.faq ?? [];

  return items.map((item) => ({ question: item.question, answer: item.answer }));
}
