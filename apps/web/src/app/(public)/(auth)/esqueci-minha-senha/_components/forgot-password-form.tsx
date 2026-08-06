"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordInputSchema,
  type ForgotPasswordInput,
} from "@/schemas/auth/forgot-password.schema";

export function ForgotPasswordForm() {
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordInputSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setFormError(null);
    const result = await forgotPassword(data);

    // A resposta é a mesma exista ou não a conta — não ramifique a mensagem por
    // resultado aqui, senão a tela vira o verificador de e-mails que a API evita ser.
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }

    setSentMessage(result.message ?? null);
  };

  if (sentMessage) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
        {sentMessage}
      </p>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-email">
                E-mail <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="forgot-email"
                type="email"
                autoComplete="email"
                className="h-11"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {formError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-11 bg-brand-blue-800 text-base font-bold text-white hover:bg-brand-blue-900"
        >
          {form.formState.isSubmitting
            ? "Enviando..."
            : "Enviar link de recuperação"}
        </Button>
      </FieldGroup>
    </form>
  );
}
