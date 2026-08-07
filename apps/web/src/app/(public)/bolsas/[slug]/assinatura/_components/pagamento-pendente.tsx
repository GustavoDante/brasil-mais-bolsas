"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getPayment } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isPaidStatus } from "@/lib/mappers/checkout.mapper";
import type { CheckoutCharge } from "@/types/checkout";

/** De quanto em quanto tempo perguntamos à API se a baixa já chegou. */
const POLL_INTERVAL_MS = 5_000;

/** Depois disso paramos de perguntar: a confirmação também chega por e-mail. */
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

interface PagamentoPendenteProps {
  charge: CheckoutCharge;
  /** Id da bolsa, para montar o destino da página de agradecimento. */
  bolsaId: string;
}

/**
 * Acompanhamento de PIX e boleto.
 *
 * A baixa não acontece na resposta da cobrança: quem confirma é o webhook do Asaas, então a
 * tela pergunta pelo pagamento até ele mudar de status. O `GET /v1/payment/:id` devolve só
 * o pagamento do próprio usuário — a sessão já existe aqui, porque o checkout de visitante
 * grava o token junto com a cobrança.
 */
export function PagamentoPendente({ charge, bolsaId }: PagamentoPendenteProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    let cancelled = false;

    const check = async () => {
      const result = await getPayment({ id: charge.paymentId });

      if (cancelled) return;

      if (result.ok && isPaidStatus(result.data.status)) {
        clearInterval(timer);
        router.replace(
          `/bolsas/${bolsaId}/assinatura/obrigado?pagamento=${charge.paymentId}`,
        );
        return;
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        setExpired(true);
      }
    };

    const timer = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [charge.paymentId, bolsaId, router]);

  const copyValue = charge.method === "PIX" ? charge.pixCopyPaste : charge.barCode;

  const handleCopy = async () => {
    if (!copyValue) return;

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      toast.success(
        charge.method === "PIX" ? "Código PIX copiado." : "Linha digitável copiada.",
      );
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  return (
    <Card className="gap-0 rounded-2xl border border-neutral-200 bg-white p-8 ring-0">
      <div className="flex items-center gap-3">
        {expired ? (
          <Check className="size-5 text-brand-green-600" aria-hidden />
        ) : (
          <Loader2 className="size-5 animate-spin text-brand-blue-700" aria-hidden />
        )}
        <h2 className="text-2xl font-bold text-black">
          {charge.method === "PIX" ? "Pague com PIX" : "Boleto gerado"}
        </h2>
      </div>

      <p className="mt-2 text-sm text-neutral-600" role="status">
        {expired
          ? "Continuamos aguardando a confirmação do banco. Assim que ela chegar, avisamos por e-mail e a bolsa aparece na sua área do aluno."
          : charge.method === "PIX"
            ? "Assim que o pagamento for confirmado, esta página segue sozinha para a confirmação."
            : "A compensação do boleto leva até 3 dias úteis. Esta página avisa assim que a confirmação chegar."}
      </p>

      {charge.method === "PIX" && charge.pixQrCodeImage && (
        <div className="mt-6 flex justify-center">
          <Image
            src={`data:image/png;base64,${charge.pixQrCodeImage}`}
            alt="QR Code do PIX"
            width={240}
            height={240}
            unoptimized
            className="rounded-xl border border-neutral-200 p-2"
          />
        </div>
      )}

      {copyValue && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-neutral-700">
            {charge.method === "PIX" ? "PIX copia e cola" : "Linha digitável"}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-neutral-100 px-4 py-3 font-mono text-xs text-neutral-700">
              {copyValue}
            </code>
            <Button type="button" variant="outline" onClick={handleCopy} className="h-11">
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      )}

      {(charge.bankSlipUrl ?? charge.invoiceUrl) && (
        <Button asChild variant="outline" className="mt-6 h-11 w-full sm:w-auto">
          <a
            href={charge.bankSlipUrl ?? charge.invoiceUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="size-4" aria-hidden />
            {charge.method === "BOLETO" ? "Abrir boleto" : "Abrir cobrança"}
          </a>
        </Button>
      )}
    </Card>
  );
}
