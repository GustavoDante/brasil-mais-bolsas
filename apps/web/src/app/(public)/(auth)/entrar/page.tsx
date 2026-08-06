import type { Metadata } from "next";
import Link from "next/link";

import { withCallbackUrl } from "@/lib/utils";

import { AuthCard } from "../_components/auth-card";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta do Brasil Mais Bolsas.",
  alternates: { canonical: "/entrar" },
  robots: { index: false, follow: true },
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard className="max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-brand-blue-900">Entrar</h1>
        <p className="text-sm text-neutral-600">
          Acesse com o e-mail e a senha do seu cadastro.
        </p>
      </div>

      <LoginForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-neutral-600">
        Ainda não tem conta?{" "}
        <Link
          href={withCallbackUrl("/cadastro", callbackUrl)}
          className="font-semibold text-brand-blue-700 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
