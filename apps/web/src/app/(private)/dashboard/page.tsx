import type { Metadata } from "next";

import { signOutForm } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { requireServerSession } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const { user } = await requireServerSession();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-blue-900">Minha conta</h1>
      <p className="mt-2 text-neutral-600">Logado como {user.email}</p>

      <form action={signOutForm} className="mt-6">
        <Button type="submit" variant="outline" className="h-10">
          Sair
        </Button>
      </form>
    </main>
  );
}
