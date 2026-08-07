"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import type { CheckoutFormValues } from "@/schemas/checkout/checkout-form.schema";
import type { CheckoutPaymentMethod } from "@/types/checkout";
import { TermosDialog } from "./termos-dialog";

const METHOD_LABEL: Record<CheckoutPaymentMethod, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
};

interface StepConfirmacaoProps {
  form: UseFormReturn<CheckoutFormValues>;
  summary: Array<{ label: string; value: string }>;
}

export function StepConfirmacao({ form, summary }: StepConfirmacaoProps) {
  const { control } = form;

  return (
    <FieldGroup className="gap-8">
      <FieldSet>
        <FieldLegend variant="label">Confirme os dados</FieldLegend>
        <FieldDescription>
          Revise antes de gerar a cobrança. Você ainda pode voltar e corrigir.
        </FieldDescription>

        <dl className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white text-sm">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-4 px-4 py-3"
            >
              <dt className="text-neutral-600">{item.label}</dt>
              <dd className="text-right font-semibold text-neutral-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      </FieldSet>

      <Controller
        control={control}
        name="accepted_terms"
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <Checkbox
              id="checkout-accepted-terms"
              checked={field.value === true}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={fieldState.invalid}
            />
            <div className="grid gap-1">
              <FieldLabel htmlFor="checkout-accepted-terms" className="font-normal">
                Li e aceito os <TermosDialog /> de uso e contratação.
              </FieldLabel>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </div>
          </Field>
        )}
      />
    </FieldGroup>
  );
}

export { METHOD_LABEL };
