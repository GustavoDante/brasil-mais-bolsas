import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/seo";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/structured-data";

import "./globals.css";

/**
 * Layout raiz: o **único** lugar com `<html>`/`<body>`.
 *
 * Precisa viver aqui, e não dentro de um grupo de rota, porque grupo não aparece na URL
 * mas continua sendo um nível da árvore: um layout com `<html>` dentro de `(public)`
 * atende só as rotas daquele grupo, e `(auth)`/`(private)` sobem sem casca — o Next
 * responde "Missing `<html>` and `<body>` tags in the root layout" em runtime, sem
 * reprovar o build.
 *
 * Aqui ficam apenas as coisas que valem para o site inteiro: fontes, tokens do Tailwind,
 * metadata base e a identidade JSON-LD referenciada por `@id` nas rotas. O cabeçalho e o
 * rodapé são do grupo `(public)` — as telas de autenticação e o painel não os exibem.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base de todas as URLs relativas de metadata (canonical, Open Graph, sitemap).
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — bolsas de estudo de até 70% de desconto`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: "/",
    title: `${siteConfig.name} — bolsas de estudo de até 70% de desconto`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — bolsas de estudo de até 70% de desconto`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#002fa8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Identidade do site: declarada uma vez e referenciada por `@id` nas rotas. */}
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
