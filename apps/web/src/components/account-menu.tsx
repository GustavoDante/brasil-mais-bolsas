"use client";

import { ChevronDown, LogOut, User } from "lucide-react";

import { signOutForm } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountMenuProps {
  email: string;
  /** Texto do papel/instituição, exibido abaixo do e-mail. */
  subtitle?: string;
  /** Rota do perfil — muda conforme o painel. */
  profileHref: string;
}

/**
 * Menu da conta, compartilhado pelos dois painéis.
 *
 * Sair continua sendo `<form action={signOutForm}>` e não um `onClick`: a action apaga o
 * cookie httpOnly no servidor, e o formulário funciona mesmo antes da hidratação.
 */
export function AccountMenu({ email, subtitle, profileHref }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2 text-sm">
          <span className="grid size-8 place-items-center rounded-full bg-brand-blue-800 text-white">
            <User className="size-4" aria-hidden />
          </span>
          <span className="hidden max-w-40 truncate sm:inline">{email}</span>
          <ChevronDown className="size-4 text-neutral-500" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-semibold">{email}</span>
          {subtitle && (
            <span className="block truncate text-xs text-neutral-500">
              {subtitle}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href={profileHref}>Meu perfil</a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild variant="destructive">
          <form action={signOutForm}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" aria-hidden />
              Sair
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
