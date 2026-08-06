import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Metadata das telas privadas.
 *
 * Toda rota declara `alternates.canonical` (regra do CLAUDE.md do web) e painel nunca é
 * indexável — daí o par estar aqui em vez de repetido em cada `page.tsx`, onde um dos dois
 * acabaria esquecido.
 */
export function panelMetadata(title: string, path: string): Metadata {
  return {
    title,
    alternates: { canonical: path },
    robots: { index: false, follow: false },
  };
}

interface PanelPageHeaderProps {
  title: string;
  description?: string;
  /** Ação à direita do título (botão de criar, filtro). */
  action?: React.ReactNode;
}

export function PanelPageHeader({
  title,
  description,
  action,
}: PanelPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface UnderConstructionProps {
  /** Rota da API que vai alimentar a tela. Deixa explícito o que falta ligar. */
  endpoint: string;
}

export function UnderConstruction({ endpoint }: UnderConstructionProps) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <p className="font-semibold text-neutral-700">Tela em construção</p>
        <p className="mt-2 text-sm text-neutral-500">
          Vai consumir{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
            {endpoint}
          </code>
          .
        </p>
      </CardContent>
    </Card>
  );
}
