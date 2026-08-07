"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCepAutofill } from "@/hooks/use-cep-autofill";
import { formatCep } from "@/lib/viacep";
import type { CheckoutFormValues } from "@/schemas/checkout/checkout-form.schema";
import { CheckoutField } from "./checkout-field";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

interface StepDadosProps {
  form: UseFormReturn<CheckoutFormValues>;
  /** Aluno logado: os dados vêm da conta e não podem ser editados por aqui. */
  locked: boolean;
}

/**
 * Passo 1 — o que a API exige para criar a conta do aluno.
 *
 * São exatamente os campos obrigatórios do cadastro (`CheckoutCustomerSchema`): os
 * opcionais do cadastro completo ficam de fora para não alongar uma compra.
 */
export function StepDados({ form, locked }: StepDadosProps) {
  const { control, setValue } = form;
  const cep = form.watch("customer.address.postal_code");

  const cepLoading = useCepAutofill(locked ? "" : cep, (address) => {
    const options = { shouldValidate: true } as const;
    if (address.street) setValue("customer.address.street", address.street, options);
    if (address.district) setValue("customer.address.district", address.district, options);
    if (address.city) setValue("customer.address.city", address.city, options);
    if (address.state) setValue("customer.address.state", address.state, options);
  });

  return (
    <FieldGroup className="gap-8">
      <FieldSet>
        <FieldLegend variant="label">Seus dados</FieldLegend>
        <FieldDescription>
          {locked
            ? "Estes dados vêm da sua conta. Para alterá-los, acesse a área do aluno."
            : "Usamos o CPF para confirmar sua identidade junto à instituição. Sua senha inicial será o CPF (somente números)."}
        </FieldDescription>

        <FieldGroup className="gap-5">
          <CheckoutField
            control={control}
            name="customer.name"
            label="Nome completo"
            autoComplete="name"
            readOnly={locked}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <CheckoutField
              control={control}
              name="customer.email"
              label="E-mail"
              type="email"
              autoComplete="email"
              readOnly={locked}
            />
            <CheckoutField
              control={control}
              name="customer.birthdate"
              label="Data de nascimento"
              type="date"
              readOnly={locked}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <CheckoutField
              control={control}
              name="customer.cpf"
              label="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              readOnly={locked}
            />
            <CheckoutField
              control={control}
              name="customer.rg"
              label="RG"
              readOnly={locked}
            />
            <CheckoutField
              control={control}
              name="customer.rg_emissor"
              label="Órgão emissor"
              placeholder="SSP-PE"
              readOnly={locked}
            />
          </div>

          <CheckoutField
            control={control}
            name="customer.phone"
            label="Telefone"
            type="tel"
            autoComplete="tel"
            placeholder="(81) 90000-0000"
            readOnly={locked}
            className="sm:max-w-[280px]"
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Endereço</FieldLegend>
        <FieldDescription>
          {locked
            ? "Endereço cadastrado na sua conta."
            : "Digite o CEP e preenchemos o resto para você."}
        </FieldDescription>

        <FieldGroup className="gap-5">
          <Controller
            control={control}
            name="customer.address.postal_code"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:max-w-[220px]">
                <FieldLabel htmlFor="checkout-address-postal-code">
                  CEP
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <InputGroup className="h-11">
                  <InputGroupInput
                    {...field}
                    id="checkout-address-postal-code"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    readOnly={locked}
                    className="h-11"
                    aria-invalid={fieldState.invalid}
                    aria-busy={cepLoading}
                    value={formatCep(field.value ?? "")}
                    onChange={(event) => field.onChange(formatCep(event.target.value))}
                  />
                  {cepLoading && (
                    <InputGroupAddon align="inline-end">
                      <Loader2 className="animate-spin text-brand-blue-700" aria-hidden />
                      <span className="sr-only">Buscando endereço…</span>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <CheckoutField
              control={control}
              name="customer.address.street"
              label="Rua"
              autoComplete="address-line1"
              readOnly={locked}
            />
            <CheckoutField
              control={control}
              name="customer.address.number"
              label="Número"
              readOnly={locked}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <CheckoutField
              control={control}
              name="customer.address.district"
              label="Bairro"
              readOnly={locked}
            />
            <CheckoutField
              control={control}
              name="customer.address.complement"
              label="Complemento"
              placeholder="Apto, bloco…"
              optional
              readOnly={locked}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
            <CheckoutField
              control={control}
              name="customer.address.city"
              label="Cidade"
              autoComplete="address-level2"
              readOnly={locked}
            />

            {/* Radix Select não emite `onChange` nativo — precisa de `Controller`. */}
            <Controller
              control={control}
              name="customer.address.state"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="checkout-address-state">
                    UF
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={locked}
                  >
                    <SelectTrigger
                      id="checkout-address-state"
                      className="h-11 w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  );
}
