export interface PromoCardData {
  id: string;
  title: string;
  highlight: string;
  discount: string;
  variant: "blue" | "green";
}

export const promoCards: PromoCardData[] = [
  {
    id: "promo-blue-1",
    title: "Boleto ou cartão de crédito à vista ou parcelado",
    highlight: "Contrate a sua bolsa",
    discount: "70% OFF",
    variant: "blue",
  },
  {
    id: "promo-green-1",
    title: "Boleto ou cartão de crédito à vista ou parcelado",
    highlight: "Garanta até 70% de desconto",
    discount: "70% OFF",
    variant: "green",
  },
  {
    id: "promo-blue-2",
    title: "Desconto especial para novos alunos",
    highlight: "Matrícula com desconto",
    discount: "50% OFF",
    variant: "blue",
  },
  {
    id: "promo-green-2",
    title: "Bolsas de estudo para Ensino Fundamental e Médio",
    highlight: "Garanta sua vaga",
    discount: "60% OFF",
    variant: "green",
  },
  {
    id: "promo-blue-3",
    title: "Condições exclusivas para mensalidades do ano letivo",
    highlight: "Economize todo mês",
    discount: "75% OFF",
    variant: "blue",
  },
];
