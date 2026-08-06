"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { STUDENT_NAV } from "./nav-items";

function isActive(pathname: string, href: string): boolean {
  if (href === "/aluno") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegação horizontal do aluno.
 *
 * Rola no eixo x em telas estreitas em vez de virar gaveta: são seis destinos rasos, e uma
 * barra visível dá o mapa inteiro de uma vez — diferente do backoffice, onde o menu cresce.
 */
export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do aluno"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      <ul className="flex min-w-max items-center gap-1">
        {STUDENT_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-blue-800 text-white"
                    : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
