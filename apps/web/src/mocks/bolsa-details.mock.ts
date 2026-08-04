import { bolsas } from "@/mocks/bolsas.mock";
import type { BolsaDetailData, BolsaFaqItem } from "@/types/scholarship";

export type { BolsaDetailData, BolsaFaqItem } from "@/types/scholarship";

const schoolShortNames: Record<string, string> = {
  "FAP - Faculdade dos Palmares": "FAP",
  UNINASSAU: "UNINASSAU",
  Estácio: "Estácio",
  "Maurício de Nassau": "Nassau",
};

const courseDescriptions: Record<string, string> = {
  Administração:
    "O curso de Administração prepara você para gerir empresas e equipes nas áreas de finanças, marketing e recursos humanos. A graduação do tipo bacharelado dura em média 4 anos, e você pode estudar presencialmente ou a distância.",
  Direito:
    "O curso de Direito forma profissionais capazes de interpretar e aplicar as leis em causas cíveis, criminais, trabalhistas e tributárias. O bacharelado dura em média 5 anos e habilita você a prestar o exame da OAB.",
  Psicologia:
    "O curso de Psicologia estuda o comportamento e os processos mentais, preparando você para atuar em clínicas, escolas, hospitais e organizações. O bacharelado dura em média 5 anos.",
  Biomedicina:
    "O curso de Biomedicina forma profissionais para atuar em análises clínicas, pesquisa e diagnóstico por imagem. O bacharelado dura em média 4 anos e abre mais de 35 áreas de habilitação.",
  Enfermagem:
    "O curso de Enfermagem prepara você para o cuidado direto ao paciente e para a gestão de equipes de saúde em hospitais, clínicas e unidades básicas. O bacharelado dura em média 5 anos.",
  Pedagogia:
    "O curso de Pedagogia forma educadores para a educação infantil, os anos iniciais do ensino fundamental e a gestão escolar. A licenciatura dura em média 4 anos.",
  "Engenharia Civil":
    "O curso de Engenharia Civil prepara você para projetar, executar e fiscalizar obras de edificações, estradas e saneamento. O bacharelado dura em média 5 anos.",
  "Ciência da Computação":
    "O curso de Ciência da Computação forma profissionais para o desenvolvimento de software, inteligência artificial e infraestrutura de sistemas. O bacharelado dura em média 4 anos.",
};

const defaultFaq: BolsaFaqItem[] = [
  {
    question: "Condições especiais da faculdade",
    answer:
      "A bolsa é válida para novos alunos que ainda não possuem vínculo com a instituição. O desconto incide sobre a mensalidade cheia e não é cumulativo com outros programas de financiamento ou descontos já concedidos pela faculdade.",
  },
  {
    question: "Como funciona a modalidade EaD?",
    answer:
      "Nas turmas a distância as aulas ficam disponíveis no ambiente virtual de aprendizagem e podem ser assistidas no horário que você preferir. As avaliações e os estágios obrigatórios são feitos presencialmente no polo escolhido na matrícula.",
  },
  {
    question: "Quais são as características da vaga?",
    answer:
      "Cada vaga tem turno, modalidade e período de ingresso definidos pela faculdade. Confira essas informações no topo desta página antes de garantir a sua bolsa, porque elas não podem ser alteradas depois da matrícula.",
  },
  {
    question: "O desconto é até o final do curso?",
    answer:
      "Sim. O percentual de desconto contratado se mantém do primeiro ao último semestre, desde que você renove a matrícula em dia e permaneça no mesmo curso, turno e unidade.",
  },
  {
    question: "Avisos",
    answer:
      "Os valores exibidos são referentes à mensalidade do semestre vigente e podem ser reajustados anualmente pela instituição de ensino, sempre preservando o percentual de desconto da sua bolsa.",
  },
  {
    question: "O que pode fazer a bolsa ser cancelada?",
    answer:
      "A bolsa pode ser cancelada em caso de trancamento, transferência de curso ou unidade, atraso recorrente no pagamento das mensalidades ou desligamento por questões acadêmicas e disciplinares.",
  },
];

const gallery = [
  "/mock/campus-1.png",
  "/mock/campus-2.png",
  "/mock/campus-3.png",
  "/mock/campus-4.png",
  "/mock/campus-5.png",
  "/mock/campus-6.png",
];

export function getBolsaDetail(id: string): BolsaDetailData | null {
  const card = bolsas.find((bolsa) => bolsa.id === id);

  if (!card) {
    return null;
  }

  const schoolShortName = schoolShortNames[card.school] ?? card.school;

  return {
    ...card,
    schoolShortName,
    breadcrumb: [
      "Bolsas de estudo",
      "Faculdades e universidades",
      schoolShortName,
      card.course,
    ],
    title: `${card.course} na ${card.school}`,
    courseDescription:
      courseDescriptions[card.course] ??
      `O curso de ${card.course} é oferecido pela ${card.school} na modalidade ${card.modalidade}, com aulas no turno da ${card.shift.toLowerCase()}.`,
    startDate: "Início imediato",
    duration: "8 Semestres",
    faq: defaultFaq,
    mapImage: "/mock/campus-map.png",
    aboutDescription: `A ${card.school} investe em infraestrutura e no corpo docente para levar à cidade de ${card.neighborhood.split("–")[0].trim()} os mais altos padrões de qualidade de ensino superior, tendo atingido uma nota 4 de 5 em avaliação do MEC. Ainda não nos conhece? Clique no botão “Saiba mais” e fique por dentro desta nova conquista para a região.`,
    galleryFeatured: "/mock/campus-featured.png",
    gallery,
  };
}

export const bolsaDetailIds = bolsas.map((bolsa) => bolsa.id);
