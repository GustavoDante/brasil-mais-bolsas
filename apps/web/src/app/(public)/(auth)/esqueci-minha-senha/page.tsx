import type { Metadata } from "next";
import Link from "next/link";

import { withCallbackUrl } from "@/lib/utils";

import { AuthCard } from "../_components/auth-card";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  description: "Receba por e-mail o link para redefinir sua senha.",
  alternates: { canonical: "/esqueci-minha-senha" },
  robots: { index: false, follow: true },
};

interface ForgotPasswordPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard className="max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-blue-900">
          Esqueci minha senha
        </h1>
        <p className="text-sm text-neutral-600">
          Informe o e-mail do seu cadastro e enviaremos o link para criar uma nova
          senha.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-neutral-600">
        Lembrou a senha?{" "}
        <Link
          href={withCallbackUrl("/entrar", callbackUrl)}
          className="font-semibold text-brand-blue-700 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
