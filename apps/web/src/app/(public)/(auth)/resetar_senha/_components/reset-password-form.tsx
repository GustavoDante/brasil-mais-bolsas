"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { resetPassword } from "@/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  resetPasswordInputSchema,
  type ResetPasswordInput,
} from "@/schemas/auth/reset-password.schema";

interface ResetPasswordFormProps {
  /** Token que veio na query string do link enviado por e-mail. */
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordInputSchema),
    defaultValues: { token, password: "", repassword: "" },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);
    const result = await resetPassword(data);

    if (!result.ok) {
      for (const [field, messages] of Object.entries(
        result.error.fieldErrors ?? {},
      )) {
        form.setError(field as keyof ResetPasswordInput, {
          message: messages[0],
        });
      }
      setFormError(result.error.message);
      return;
    }

    router.push("/entrar");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* O token não é editável: veio do link, o usuário só confirma a senha nova. */}
      <input type="hidden" {...form.register("token")} />

      <FieldGroup>
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-password">
                Nova senha <span className="text-destructive">*</span>
              </FieldLabel>
              <PasswordInput
                {...field}
                id="reset-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="repassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-repassword">
                Confirme a nova senha <span className="text-destructive">*</span>
              </FieldLabel>
              <PasswordInput
                {...field}
                id="reset-repassword"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {(formError || form.formState.errors.token) && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
            {formError ?? form.formState.errors.token?.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-11 bg-brand-blue-800 text-base font-bold text-white hover:bg-brand-blue-900"
        >
          {form.formState.isSubmitting ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
