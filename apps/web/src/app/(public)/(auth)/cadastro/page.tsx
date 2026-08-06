import type { Metadata } from "next";
import Link from "next/link";

import { withCallbackUrl } from "@/lib/utils";

import { AuthCard } from "../_components/auth-card";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Cadastre-se para concorrer às bolsas de estudo.",
  alternates: { canonical: "/cadastro" },
  robots: { index: true, follow: true },
};

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard className="max-w-3xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-blue-900">Criar conta</h1>
        <p className="text-sm text-neutral-600">
          Campos marcados com <span className="text-destructive">*</span> são
          obrigatórios.
        </p>
      </div>

      <RegisterForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-neutral-600">
        Já tem conta?{" "}
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
