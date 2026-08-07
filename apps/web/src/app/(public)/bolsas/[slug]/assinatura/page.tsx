import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCheckoutCustomerPrefill } from "@/data/checkout.data";
import { getBolsaDetail } from "@/data/scholarships.data";
import { AssinaturaWizard } from "./_components/assinatura-wizard";

interface AssinaturaPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Contratação da bolsa.
 *
 * `noindex`: é uma tela transacional, com dado do aluno na sessão e nenhum conteúdo para
 * indexar — quem precisa achar a oferta acha pela página da bolsa, que aponta para cá.
 */
export const metadata: Metadata = {
  title: "Contratar bolsa",
  robots: { index: false, follow: true },
};

export default async function AssinaturaPage({ params }: AssinaturaPageProps) {
  const { slug } = await params;
  const detail = await getBolsaDetail(slug);

  if (!detail) {
    notFound();
  }

  // `null` para visitante: o formulário começa no passo de cadastro. Sessão válida traz os
  // dados já preenchidos e travados, e o aluno entra direto no passo de pagamento.
  const customer = await getCheckoutCustomerPrefill();

  return (
    <main className="w-full bg-neutral-100 py-10">
      <div className="mx-auto w-full max-w-[1100px] px-4">
        <AssinaturaWizard bolsa={detail} customer={customer} />
      </div>
    </main>
  );
}
