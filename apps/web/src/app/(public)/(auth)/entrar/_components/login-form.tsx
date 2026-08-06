"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signIn } from "@/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isSafeRedirectPath, withCallbackUrl } from "@/lib/utils";
import {
  signInInputSchema,
  type SignInInput,
} from "@/schemas/auth/sign-in.schema";

interface LoginFormProps {
  /** Rota que o usuário tentou abrir antes de ser mandado para cá. */
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInInput) => {
    setFormError(null);
    const result = await signIn(data);

    if (!result.ok) {
      for (const [field, messages] of Object.entries(
        result.error.fieldErrors ?? {},
      )) {
        form.setError(field as keyof SignInInput, { message: messages[0] });
      }
      setFormError(result.error.message);
      return;
    }

    router.push(isSafeRedirectPath(callbackUrl) ? callbackUrl : "/dashboard");
    // Sem isso o layout raiz continua com a sessão antiga e o header não atualiza.
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">
                E-mail <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                autoComplete="email"
                className="h-11"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">
                Senha <span className="text-destructive">*</span>
              </FieldLabel>
              <PasswordInput
                {...field}
                id="login-password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Se você acabou de se cadastrar, sua senha é o seu CPF (somente
                números).
              </FieldDescription>
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
          {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
        </Button>

        <Link
          href={withCallbackUrl("/esqueci-minha-senha", callbackUrl)}
          className="text-center text-sm text-brand-blue-700 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </FieldGroup>
    </form>
  );
}
