/**
 * Formatação de valores para a UI (pt-BR).
 *
 * Campos `Decimal` do Prisma chegam como string na resposta da API — sempre passe por
 * `toNumber` antes de fazer conta, nunca use `Number(x) || 0` espalhado pelos componentes.
 */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** `1234.5` → `"R$ 1.234,50"` */
export function formatBRL(value: string | number | null | undefined): string {
  return brlFormatter.format(toNumber(value));
}

/**
 * Divide o preço em parte inteira e centavos, como os cards exibem
 * (`"R$ 680"` + `",40"`).
 */
export function splitBRL(value: string | number | null | undefined): {
  amount: string;
  cents: string;
} {
  const formatted = formatBRL(value);
  const separatorIndex = formatted.lastIndexOf(",");

  if (separatorIndex === -1) return { amount: formatted, cents: "" };

  return {
    amount: formatted.slice(0, separatorIndex),
    cents: formatted.slice(separatorIndex),
  };
}

/**
 * `"R$ 1.234,50"` → `1234.5`. Caminho inverso de `formatBRL`, usado quando um valor já
 * formatado precisa voltar a ser número — por exemplo no `price` do JSON-LD, que exige
 * ponto decimal e nada de símbolo de moeda.
 */
export function parseBRL(value: string | null | undefined): number {
  if (!value) return 0;

  const digits = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return toNumber(digits);
}

/** `"noturno"` → `"Noturno"`; `"segundas-manha"` → `"Segundas manhã"`. */
export function formatShift(shift: string | null | undefined): string {
  if (!shift) return "";

  const normalized = shift.trim().replace(/[-_]+/g, " ");
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
    .join(" ");
}

/** `"RECIFE"` → `"Recife"` (a base legada tem cidades em caixa alta). */
export function formatCity(city: string | null | undefined): string {
  if (!city) return "";

  return city
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word.length <= 2 ? word : word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1)
    )
    .join(" ");
}
