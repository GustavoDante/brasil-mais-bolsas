"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createCheckout } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBRL, parseBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  checkoutFormSchema,
  checkoutPaymentStepSchema,
  checkoutTermsStepSchema,
  type CheckoutFormValues,
} from "@/schemas/checkout/checkout-form.schema";
import type { CheckoutInput } from "@/schemas/checkout/checkout.schema";
import { toCheckoutCharge } from "@/lib/mappers/checkout.mapper";
import type { CheckoutCharge, CheckoutCustomerPrefill } from "@/types/checkout";
import type { BolsaDetailData } from "@/types/scholarship";
import { PagamentoPendente } from "./pagamento-pendente";
import { ResumoBolsa } from "./resumo-bolsa";
import { StepConfirmacao, METHOD_LABEL } from "./step-confirmacao";
import { StepDados } from "./step-dados";
import { StepPagamento } from "./step-pagamento";

const STEPS = [
  { id: "dados", title: "Seus dados" },
  { id: "pagamento", title: "Pagamento" },
  { id: "confirmacao", title: "Confirmação" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/** Teto de parcelas do gateway (o contrato aceita de 1 a 21). */
const MAX_INSTALLMENTS = 21;

/** Prefixo do campo que errou → passo que precisa aparecer para a pessoa corrigir. */
const STEP_BY_FIELD_PREFIX: Record<string, StepId> = {
  customer: "dados",
  payment: "pagamento",
  accepted_terms: "confirmacao",
};

interface AssinaturaWizardProps {
  bolsa: BolsaDetailData;
  /** `null` quando não há sessão — aí o passo de cadastro é obrigatório. */
  customer: CheckoutCustomerPrefill | null;
}

function toDefaultValues(
  customer: CheckoutCustomerPrefill | null,
): CheckoutFormValues {
  return {
    customer: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      birthdate: customer?.birthdate ?? "",
      cpf: customer?.cpf ?? "",
      rg: customer?.rg ?? "",
      rg_emissor: customer?.rgEmissor ?? "",
      address: {
        street: customer?.address.street ?? "",
        number: customer?.address.number ?? "",
        complement: customer?.address.complement ?? "",
        district: customer?.address.district ?? "",
        city: customer?.address.city ?? "",
        state: customer?.address.state ?? "",
        postal_code: customer?.address.postalCode ?? "",
      },
    },
    payment: {
      method: "PIX",
      installment_count: 1,
      creditCard: {
        holderName: "",
        number: "",
        expiryMonth: "",
        expiryYear: "",
        ccv: "",
      },
      creditCardHolderInfo: {
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        cpfCnpj: customer?.cpf ?? "",
        postalCode: customer?.address.postalCode ?? "",
        addressNumber: customer?.address.number ?? "",
        addressComplement: customer?.address.complement ?? "",
        phone: customer?.phone ?? "",
        mobilePhone: customer?.phone ?? "",
      },
    },
    accepted_terms: false,
  };
}

/**
 * Contratação da bolsa em três passos.
 *
 * **Validação por passo**: cada passo é conferido com o seu próprio schema — os dados do
 * aluno com `customer` (que é o `CheckoutCustomerSchema` do contrato) e o pagamento com o
 * `CheckoutPaymentSchema`, que carrega as condicionais do cartão. Só depois de os três
 * passarem é que o corpo montado vai para a action, onde o `CheckoutSchema` inteiro valida
 * de novo — a mesma regra que o NestJS aplica do outro lado.
 *
 * Com sessão, o passo 1 abre travado e o fluxo começa no pagamento.
 */
export function AssinaturaWizard({ bolsa, customer }: AssinaturaWizardProps) {
  const router = useRouter();
  const isAuthenticated = customer !== null;
  const [stepIndex, setStepIndex] = useState(isAuthenticated ? 1 : 0);
  const [charge, setCharge] = useState<CheckoutCharge | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: toDefaultValues(customer),
    mode: "onBlur",
  });

  const step = STEPS[stepIndex];
  const method = form.watch("payment.method");
  const installments = form.watch("payment.installment_count");
  const monthlyPrice = parseBRL(`${bolsa.discountedPrice}${bolsa.discountedPriceCents}`);

  const installmentLabel = (count: number) =>
    count === 1
      ? `À vista — ${formatBRL(monthlyPrice)}`
      : `${count}x de ${formatBRL(monthlyPrice / count)}`;

  /**
   * O `payment` como o contrato o espera.
   *
   * Os campos do cartão continuam no estado do formulário mesmo depois de a pessoa trocar
   * para PIX (o input só sai do DOM), e mandá-los numa cobrança à vista é justamente o que
   * o `CheckoutPaymentSchema` recusa. Recortar aqui — e validar **este** objeto, não o
   * estado cru — é o que faz a validação do passo enxergar o que vai ser enviado.
   */
  const toPaymentPayload = (values: CheckoutFormValues) =>
    values.payment.method === "CREDIT_CARD"
      ? {
          method: "CREDIT_CARD" as const,
          installment_count: values.payment.installment_count,
          creditCard: values.payment.creditCard,
          creditCardHolderInfo: values.payment.creditCardHolderInfo,
        }
      : { method: values.payment.method, installment_count: 1 };

  /**
   * Corpo da requisição. O `payment` chega **já validado** pelo schema do contrato — é de
   * lá que vem a garantia de que os campos do cartão estão completos, e não de um cast.
   */
  const toCheckoutInput = (
    values: CheckoutFormValues,
    payment: CheckoutInput["payment"],
    acceptedTerms: true,
  ): CheckoutInput => ({
    scholarship_id: bolsa.id,
    // Com sessão o cadastro não vai no corpo: o usuário é o do token.
    ...(isAuthenticated ? {} : { customer: values.customer }),
    payment,
    accepted_terms: acceptedTerms,
  });

  const applyIssues = (error: z.ZodError, prefix?: string) => {
    for (const issue of error.issues) {
      const path = [...(prefix ? [prefix] : []), ...issue.path].join(".");
      form.setError(path as FieldPath<CheckoutFormValues>, { message: issue.message });
    }
  };

  /**
   * Aceite dos termos — devolve o `true` literal que o contrato exige.
   *
   * O modelo do formulário guarda um `boolean` (o checkbox nasce desmarcado, e um schema
   * que só aceita `true` reprovaria o estado inicial); quem exige o aceite é o
   * `checkoutTermsStepSchema`, o mesmo recorte que a API valida.
   */
  const validateTerms = (): true | null => {
    const parsed = checkoutTermsStepSchema.safeParse({
      accepted_terms: form.getValues("accepted_terms"),
    });

    if (!parsed.success) {
      applyIssues(parsed.error);
      return null;
    }

    return parsed.data.accepted_terms;
  };

  const validateStep = async (id: StepId): Promise<boolean> => {
    if (id === "dados") {
      return form.trigger("customer", { shouldFocus: true });
    }

    if (id === "pagamento") {
      const passed = await form.trigger("payment", { shouldFocus: true });
      if (!passed) return false;

      // O schema do contrato é quem sabe o que o cartão exige — a tela não repete a regra.
      const parsed = checkoutPaymentStepSchema.safeParse(toPaymentPayload(form.getValues()));
      if (!parsed.success) {
        applyIssues(parsed.error, "payment");
        return false;
      }

      return true;
    }

    return validateTerms() !== null;
  };

  const goNext = async () => {
    if (await validateStep(step.id)) {
      setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
    }
  };

  // O aluno logado começa no pagamento, mas pode voltar e conferir os dados da conta — eles
  // aparecem preenchidos e sem edição, e é ali que um erro de cadastro fica visível.
  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    const acceptedTerms = validateTerms();
    if (!acceptedTerms) return;

    // Revalida o pagamento no envio: entre o passo 2 e o botão de confirmar a pessoa pode
    // ter voltado e mexido, e é este objeto que vai para a API.
    const payment = checkoutPaymentStepSchema.safeParse(toPaymentPayload(values));

    if (!payment.success) {
      applyIssues(payment.error, "payment");
      setStepIndex(STEPS.findIndex((item) => item.id === "pagamento"));
      return;
    }

    const result = await createCheckout(
      toCheckoutInput(values, payment.data, acceptedTerms),
    );

    if (!result.ok) {
      // O passo que ganhou o erro precisa aparecer, senão a mensagem fica numa tela que a
      // pessoa não está vendo — é o caso clássico do "e-mail já cadastrado".
      let firstStep: StepId | null = null;

      for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
        form.setError(field as FieldPath<CheckoutFormValues>, { message: messages[0] });
        const target = STEP_BY_FIELD_PREFIX[field.split(".")[0] ?? ""];
        if (target && !firstStep) firstStep = target;
      }

      if (result.error.code === "email-already-taken" || result.error.code === "cpf-already-taken") {
        firstStep = "dados";
      }

      if (firstStep) {
        setStepIndex(STEPS.findIndex((item) => item.id === firstStep));
      }

      toast.error(result.error.message);
      return;
    }

    const created = toCheckoutCharge(result.data);
    toast.success("Cobrança gerada com sucesso.");

    // Cartão aprovado já vem confirmado do gateway: não há o que acompanhar.
    if (created.paid) {
      router.replace(
        `/bolsas/${bolsa.id}/assinatura/obrigado?pagamento=${created.paymentId}`,
      );
      return;
    }

    setCharge(created);
  };

  if (charge) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <PagamentoPendente charge={charge} bolsaId={bolsa.id} />
        <ResumoBolsa
          bolsa={bolsa}
          details={[{ label: "Forma de pagamento", value: METHOD_LABEL[charge.method] }]}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <Card className="gap-0 rounded-2xl border border-neutral-200 bg-white p-6 ring-0 sm:p-8">
        <ol className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-200 pb-5">
          {STEPS.map((item, index) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  index === stepIndex
                    ? "bg-brand-blue-700 text-white"
                    : index < stepIndex
                      ? "bg-brand-green-600 text-white"
                      : "bg-neutral-200 text-neutral-600",
                )}
                aria-current={index === stepIndex ? "step" : undefined}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  index === stepIndex ? "font-semibold text-neutral-900" : "text-neutral-500",
                )}
              >
                {item.title}
              </span>
            </li>
          ))}
        </ol>

        <form onSubmit={form.handleSubmit(onSubmit)} className="pt-6">
          {step.id === "dados" && <StepDados form={form} locked={isAuthenticated} />}

          {step.id === "pagamento" && (
            <StepPagamento
              form={form}
              maxInstallments={Math.min(MAX_INSTALLMENTS, 12)}
              installmentLabel={installmentLabel}
            />
          )}

          {step.id === "confirmacao" && (
            <StepConfirmacao
              form={form}
              summary={[
                { label: "Aluno", value: form.getValues("customer.name") },
                { label: "E-mail", value: form.getValues("customer.email") },
                { label: "Curso", value: `${bolsa.course} — ${bolsa.school}` },
                { label: "Forma de pagamento", value: METHOD_LABEL[method] },
                ...(method === "CREDIT_CARD"
                  ? [{ label: "Parcelamento", value: installmentLabel(installments ?? 1) }]
                  : []),
              ]}
            />
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="h-12 sm:w-auto"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Button>

            {step.id === "confirmacao" ? (
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-12 bg-brand-blue-700 px-8 text-base font-bold text-white hover:bg-brand-blue-800"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                )}
                {form.formState.isSubmitting ? "Gerando cobrança..." : "Confirmar e pagar"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                className="h-12 bg-brand-blue-700 px-8 text-base font-bold text-white hover:bg-brand-blue-800"
              >
                Continuar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <ResumoBolsa
        bolsa={bolsa}
        details={[
          { label: "Forma de pagamento", value: METHOD_LABEL[method] },
          ...(method === "CREDIT_CARD"
            ? [{ label: "Parcelamento", value: installmentLabel(installments ?? 1) }]
            : []),
        ]}
      />
    </div>
  );
}
