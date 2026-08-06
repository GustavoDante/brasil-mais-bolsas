import Link from "next/link";
import { Menu } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UserType } from "@/lib/auth/roles";
import { ManagementNav } from "./management-nav";
import { navItemsFor } from "./nav-items";

interface ManagementShellProps {
  role: UserType;
  email: string;
  children: React.ReactNode;
}

const ROLE_LABEL: Record<UserType, string> = {
  admin: "Administrador",
  manager: "Gestor da instituição",
  user: "Aluno",
};

/**
 * Moldura do backoffice: trilho fixo à esquerda no desktop, gaveta no mobile.
 *
 * Não renderiza `<SiteHeader>`/`<SiteFooter>` — a navegação pública é do `(public)`. O
 * `<html>`/`<body>` e as fontes vêm do layout raiz.
 *
 * O menu já chega filtrado por papel: o servidor resolve `navItemsFor(role)` e o item
 * exclusivo de admin nem entra no HTML do gestor.
 */
export function ManagementShell({ role, email, children }: ManagementShellProps) {
  const items = navItemsFor(role);

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:block">
        <div className="flex h-16 items-center border-b border-neutral-200 px-5">
          <Link href="/dashboard" className="font-bold text-brand-blue-900">
            Brasil Mais Bolsas
          </Link>
        </div>
        <div className="p-3">
          <ManagementNav items={items} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-neutral-200">
                  <SheetTitle className="text-brand-blue-900">Painel</SheetTitle>
                </SheetHeader>
                <div className="p-3">
                  <ManagementNav items={items} />
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-sm font-semibold text-neutral-500">
              {ROLE_LABEL[role]}
            </span>
          </div>

          <AccountMenu
            email={email}
            subtitle={ROLE_LABEL[role]}
            profileHref="/dashboard/perfil"
          />
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
