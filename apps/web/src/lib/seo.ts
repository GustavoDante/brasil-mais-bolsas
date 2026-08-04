/**
 * Configuração de SEO compartilhada por todas as páginas.
 *
 * `siteConfig.url` é a origem canônica do site — usada em `metadataBase`, nos links
 * `canonical`, no `sitemap.xml`, no `robots.txt` e nos blocos JSON-LD. Defina
 * `NEXT_PUBLIC_SITE_URL` no ambiente (sem barra final); o fallback só serve para dev.
 */

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export const siteConfig = {
  name: "Brasil Mais Bolsas",
  shortName: "Brasil + Bolsas",
  url: normalizeUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brasilmaisbolsas.com.br"
  ),
  locale: "pt_BR",
  description:
    "Bolsas de estudo de até 70% de desconto em faculdades, cursos técnicos e escolas parceiras. Compare mensalidades, filtre por curso, cidade e modalidade e garanta a sua vaga.",
  twitter: "@brasilmaisbolsas",
} as const;

/** Caminho relativo → URL absoluta canônica. `absoluteUrl("/bolsas")`. */
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Trunca uma descrição no limite prático das SERPs (~160 caracteres), cortando na
 * última palavra inteira para não gerar reticências no meio de um termo.
 */
export function truncateDescription(text: string, maxLength = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const cut = normalized.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, "")}…`;
}
