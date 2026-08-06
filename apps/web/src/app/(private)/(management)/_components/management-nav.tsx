"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-items";

interface ManagementNavProps {
  /** Já filtrado por papel no servidor — este componente não decide permissão. */
  items: NavItem[];
  onNavigate?: () => void;
}

/**
 * Item ativo.
 *
 * `/dashboard` casa exato, senão ficaria aceso em toda tela do painel. As demais aceitam
 * subrotas, para `/dashboard/bolsas/123` manter "Bolsas" destacado.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagementNav({ items, onNavigate }: ManagementNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação do painel" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-blue-800 text-white"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
