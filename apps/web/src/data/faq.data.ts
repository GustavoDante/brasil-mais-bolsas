/** Camada de dados do FAQ. */
import { api } from "@/lib/api";
import type { BolsaFaqItem } from "@/types/scholarship";

export async function listFaq(): Promise<BolsaFaqItem[]> {
  const response = await api.faq.list();
  const items = response.faqs ?? response.faq ?? [];

  return items.map((item) => ({ question: item.question, answer: item.answer }));
}
