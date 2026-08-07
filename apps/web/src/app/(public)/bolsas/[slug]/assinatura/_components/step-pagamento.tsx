"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Barcode, CreditCard, QrCode } from "lucide-react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CheckoutFormValues } from "@/schemas/checkout/checkout-form.schema";
import type { CheckoutPaymentMethod } from "@/types/checkout";
import { CheckoutField } from "./checkout-field";

const METHODS: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  hint: string;
  icon: typeof QrCode;
}> = [
  {
    value: "PIX",
    label: "PIX",
    hint: "Aprovação em segundos, direto pelo QR Code.",
    icon: QrCode,
  },
  {
    value: "CREDIT_CARD",
    label: "Cartão de crédito",
    hint: "Parcele a bolsa e garanta a vaga na hora.",
    icon: CreditCard,
  },
  {
    value: "BOLETO",
    label: "Boleto",
    hint: "A confirmação leva até 3 dias úteis após o pagamento.",
    icon: Barcode,
  },
];

interface StepPagamentoProps {
  form: UseFormReturn<CheckoutFormValues>;
  /** Teto de parcelas da bolsa; o gateway aceita no máximo 21. */
  maxInstallments: number;
  /** Mensalidade formatada, para montar o texto de cada parcela. */
  installmentLabel: (installments: number) => string;
}

export function StepPagamento({
  form,
  maxInstallments,
  installmentLabel,
}: StepPagamentoProps) {
  const { control } = form;
  const method = form.watch("payment.method");
  const isCreditCard = method === "CREDIT_CARD";

  return (
    <FieldGroup className="gap-8">
      <FieldSet>
        <FieldLegend variant="label">Forma de pagamento</FieldLegend>
        <FieldDescription>
          A cobrança é gerada no Asaas assim que você confirmar.
        </FieldDescription>

        <Controller
          control={control}
          name="payment.method"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Parcelamento só existe no cartão: voltar para 1 evita mandar ao
                  // gateway um número de parcelas que ele recusaria à vista.
                  if (value !== "CREDIT_CARD") {
                    form.setValue("payment.installment_count", 1);
                  }
                }}
                className="gap-3 sm:grid-cols-3"
              >
                {METHODS.map((option) => {
                  const Icon = option.icon;
                  const selected = field.value === option.value;

                  return (
                    <FieldLabel
                      key={option.value}
                      htmlFor={`checkout-method-${option.value}`}
                      className={cn(
                        "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                        selected
                          ? "border-brand-blue-700 bg-brand-blue-700/5"
                          : "border-neutral-200 hover:border-neutral-300",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <RadioGroupItem
                          id={`checkout-method-${option.value}`}
                          value={option.value}
                        />
                        <Icon className="size-5 text-brand-blue-700" aria-hidden />
                        <span className="font-semibold">{option.label}</span>
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {option.hint}
                      </span>
                    </FieldLabel>
                  );
                })}
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldSet>

      {isCreditCard && (
        <>
          <FieldSet>
            <FieldLegend variant="label">Dados do cartão</FieldLegend>
            <FieldDescription>
              Os dados do cartão vão direto para o gateway de pagamento — nada é guardado
              por aqui.
            </FieldDescription>

            <FieldGroup className="gap-5">
              <Controller
                control={control}
                name="payment.installment_count"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="sm:max-w-[320px]">
                    <FieldLabel htmlFor="checkout-installments">Parcelas</FieldLabel>
                    <Select
                      value={String(field.value ?? 1)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id="checkout-installments" className="h-11 w-full">
                        <SelectValue placeholder="Em quantas vezes?" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxInstallments }, (_, index) => index + 1).map(
                          (installments) => (
                            <SelectItem key={installments} value={String(installments)}>
                              {installmentLabel(installments)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <CheckoutField
                control={control}
                name="payment.creditCard.holderName"
                label="Nome impresso no cartão"
                autoComplete="cc-name"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <CheckoutField
                  control={control}
                  name="payment.creditCard.number"
                  label="Número do cartão"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                />
                <div className="grid grid-cols-3 gap-3">
                  <CheckoutField
                    control={control}
                    name="payment.creditCard.expiryMonth"
                    label="Mês"
                    inputMode="numeric"
                    placeholder="05"
                  />
                  <CheckoutField
                    control={control}
                    name="payment.creditCard.expiryYear"
                    label="Ano"
                    inputMode="numeric"
                    placeholder="2030"
                  />
                  <CheckoutField
                    control={control}
                    name="payment.creditCard.ccv"
                    label="CVV"
                    inputMode="numeric"
                    placeholder="123"
                  />
                </div>
              </div>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">Titular do cartão</FieldLegend>
            <FieldDescription>
              Exigido pelo antifraude do gateway. Já preenchemos com os seus dados — ajuste
              se o cartão for de outra pessoa.
            </FieldDescription>

            <FieldGroup className="gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.name"
                  label="Nome do titular"
                />
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.email"
                  label="E-mail"
                  type="email"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.cpfCnpj"
                  label="CPF/CNPJ"
                  inputMode="numeric"
                />
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.postalCode"
                  label="CEP"
                  inputMode="numeric"
                />
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.addressNumber"
                  label="Número"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.mobilePhone"
                  label="Celular"
                  type="tel"
                />
                <CheckoutField
                  control={control}
                  name="payment.creditCardHolderInfo.addressComplement"
                  label="Complemento"
                  optional
                />
              </div>
            </FieldGroup>
          </FieldSet>
        </>
      )}
    </FieldGroup>
  );
}
