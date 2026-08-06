import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "../_components/auth-card";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Crie uma nova senha para sua conta.",
  alternates: { canonical: "/resetar_senha" },
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-brand-blue-900">
          Link inválido
        </h1>
        <p className="text-sm text-neutral-600">
          Este link está incompleto ou expirou. Solicite um novo para redefinir sua
          senha.
        </p>
        <Link
          href="/esqueci-minha-senha"
          className="inline-block font-semibold text-brand-blue-700 hover:underline"
        >
          Solicitar novo link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard className="max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-blue-900">
          Redefinir senha
        </h1>
        <p className="text-sm text-neutral-600">
          Escolha uma nova senha com pelo menos 8 caracteres.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
