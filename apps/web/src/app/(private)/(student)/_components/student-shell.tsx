import Link from "next/link";

import { AccountMenu } from "@/components/account-menu";
import { StudentNav } from "./student-nav";

interface StudentShellProps {
  email: string;
  children: React.ReactNode;
}

/**
 * Moldura do portal do aluno.
 *
 * De propósito mais simples que o backoffice: barra horizontal, sem trilho lateral. São
 * seis destinos visitados de vez em quando — um rail fixo de 256px seria peso morto, e a
 * diferença visual entre os dois painéis é justamente o ponto de existirem separados.
 */
export function StudentShell({ email, children }: StudentShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/aluno" className="font-bold text-brand-blue-900">
            Brasil Mais Bolsas
          </Link>

          <AccountMenu
            email={email}
            subtitle="Portal do aluno"
            profileHref="/aluno/meu-perfil"
          />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-2">
          <StudentNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
