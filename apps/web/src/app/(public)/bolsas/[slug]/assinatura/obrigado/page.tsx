import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCheckoutReceipt } from "@/data/checkout.data";
import { getBolsaDetail } from "@/data/scholarships.data";
import type { CheckoutPaymentMethod } from "@/types/checkout";
import { ResumoBolsa } from "../_components/resumo-bolsa";

interface ObrigadoPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pagamento?: string }>;
}

const METHOD_LABEL: Record<CheckoutPaymentMethod, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
};

export const metadata: Metadata = {
  title: "Bolsa contratada",
  robots: { index: false, follow: false },
};

export default async function ObrigadoPage({ params, searchParams }: ObrigadoPageProps) {
  const [{ slug }, { pagamento }] = await Promise.all([params, searchParams]);
  const detail = await getBolsaDetail(slug);

  if (!detail) {
    notFound();
  }

  // Sem o id do pagamento não há o que comemorar: volta para a contratação.
  if (!pagamento) {
    redirect(`/bolsas/${slug}/assinatura`);
  }

  const receipt = await getCheckoutReceipt(pagamento);

  // `null` quando o pagamento não é do usuário da sessão (a API responde 404 nesse caso);
  // ainda pendente significa que a baixa não chegou — nos dois casos, volta para o fluxo.
  if (!receipt || !receipt.paid) {
    redirect(`/bolsas/${slug}/assinatura`);
  }

  return (
    <main className="w-full bg-neutral-100 py-12">
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card className="gap-0 rounded-2xl border border-neutral-200 bg-white p-8 ring-0">
          <CheckCircle2 className="size-12 text-brand-green-600" aria-hidden />
          <h1 className="mt-4 text-3xl font-bold text-black">
            Pronto, sua bolsa está garantida!
          </h1>
          <p className="mt-3 text-neutral-600">
            Recebemos o seu pagamento de {receipt.amount} em {METHOD_LABEL[receipt.method ?? "PIX"]}
            {receipt.installments > 1 ? ` em ${receipt.installments}x` : ""}. Enviamos a
            confirmação para o seu e-mail — a {detail.school} entrará em contato com as
            próximas instruções da matrícula.
          </p>

          <dl className="mt-8 divide-y divide-neutral-200 rounded-xl border border-neutral-200 text-sm">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-600">Curso</dt>
              <dd className="text-right font-semibold text-neutral-800">{detail.course}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-600">Instituição</dt>
              <dd className="text-right font-semibold text-neutral-800">{detail.school}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-600">Campus</dt>
              {/* O bairro da base legada já vem com a cidade em várias linhas — repetir a
                  cidade aqui produziria "Bairro, Cidade, Cidade". */}
              <dd className="text-right font-semibold text-neutral-800">
                {detail.neighborhood || detail.city}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-600">Início das aulas</dt>
              <dd className="text-right font-semibold text-neutral-800">
                {detail.startDate}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-600">Código do pagamento</dt>
              <dd className="text-right font-mono text-xs text-neutral-600">
                {receipt.paymentId}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 bg-brand-blue-700 px-8 text-base font-bold text-white hover:bg-brand-blue-800"
            >
              <Link href="/aluno">Ir para a área do aluno</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link href={`/bolsas/${detail.id}`}>Ver a bolsa</Link>
            </Button>
          </div>
        </Card>

        <ResumoBolsa
          bolsa={detail}
          details={[
            { label: "Forma de pagamento", value: METHOD_LABEL[receipt.method ?? "PIX"] },
            { label: "Pago", value: receipt.amount },
          ]}
        />
      </div>
    </main>
  );
}
