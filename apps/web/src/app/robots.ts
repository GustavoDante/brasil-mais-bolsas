import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * As URLs filtradas de `/bolsas` são liberadas de propósito: o controle de indexação
 * delas é feito no `generateMetadata` da rota (`noindex, follow` para combinações e
 * paginação, `index` para facetas simples como `?curso=Direito`). Bloquear aqui
 * impediria o robô de ler justamente essa diretiva.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
