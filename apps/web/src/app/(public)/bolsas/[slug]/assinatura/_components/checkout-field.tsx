"use client";

import { Controller, type Control, type FieldPath } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CheckoutFormValues } from "@/schemas/checkout/checkout-form.schema";

interface CheckoutFieldProps {
  control: Control<CheckoutFormValues>;
  name: FieldPath<CheckoutFormValues>;
  label: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
  autoComplete?: string;
  placeholder?: string;
  description?: string;
  /** Campo vindo da conta do aluno: aparece preenchido e sem edição. */
  readOnly?: boolean;
  optional?: boolean;
  className?: string;
}

/**
 * Campo de texto do checkout — mesmo par `Controller` + `Field` do cadastro público.
 *
 * `readOnly` em vez de `disabled` nos campos vindos da conta: campo desabilitado sai do
 * envio do formulário e não é lido por leitor de tela, e aqui o valor precisa continuar
 * visível e submetido, só não editável.
 */
export function CheckoutField({
  control,
  name,
  label,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  description,
  readOnly = false,
  optional = false,
  className,
}: CheckoutFieldProps) {
  const id = `checkout-${name.replaceAll(".", "-")}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={id}>
            {label}
            {optional ? (
              <span className="text-xs font-normal text-muted-foreground">opcional</span>
            ) : (
              <span aria-hidden className="text-destructive">
                *
              </span>
            )}
          </FieldLabel>
          <Input
            {...field}
            value={typeof field.value === "string" ? field.value : ""}
            id={id}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            readOnly={readOnly}
            aria-readonly={readOnly || undefined}
            className={readOnly ? "h-11 bg-neutral-100 text-neutral-600" : "h-11"}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
