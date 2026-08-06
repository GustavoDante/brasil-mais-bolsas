import { apiConfig } from "@/lib/api/config";

/**
 * Resolve a URL de uma imagem vinda da API.
 *
 * A base migrada tem dois formatos no campo `image` das instituições:
 * - URL completa do S3 (registros mais novos, ex.: `https://bucket....s3.../arquivo.png`);
 * - apenas o nome do arquivo (registros antigos, ex.: `00daada...webp`), de quando os
 *   uploads ficavam no disco da API antiga.
 *
 * Os nomes soltos são resolvidos com `NEXT_PUBLIC_IMAGES_BASE_URL`. Sem essa variável,
 * usamos o placeholder — melhor um logo genérico do que uma imagem quebrada.
 */
export function resolveImageUrl(
  value: string | null | undefined,
  fallback: string
): string {
  const image = value?.trim();
  if (!image) return fallback;

  if (/^https?:\/\//i.test(image)) return image;

  // Caminho relativo servido pelo próprio site (ex.: "/placeholder/school-logo.png").
  if (image.startsWith("/")) return image;

  const base = apiConfig.imagesBaseUrl;
  if (!base) return fallback;

  return `${base}/${encodeURIComponent(image)}`;
}

/** `true` quando a URL aponta para fora do site (precisa estar liberada no next.config). */
export function isRemoteImage(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
