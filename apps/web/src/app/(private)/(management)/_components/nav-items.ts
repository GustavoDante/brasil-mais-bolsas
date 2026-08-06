import {
  Building2,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserType } from "@/lib/auth/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Papéis que enxergam o item. Admin e gestor dividem o painel, não o menu inteiro. */
  visibleTo: readonly UserType[];
}

const BOTH = ["admin", "manager"] as const;
const ADMIN_ONLY = ["admin"] as const;

/**
 * Menu do backoffice.
 *
 * A ordem é a de uso: visão geral, o que se opera todo dia, o que é cadastro, e por último
 * o que só o admin toca.
 */
export const MANAGEMENT_NAV: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Visão geral",
    icon: LayoutDashboard,
    visibleTo: BOTH,
  },
  { href: "/dashboard/bolsas", label: "Bolsas", icon: GraduationCap, visibleTo: BOTH },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart, visibleTo: BOTH },
  { href: "/dashboard/alunos", label: "Alunos", icon: Users, visibleTo: BOTH },
  {
    href: "/dashboard/inadimplentes",
    label: "Inadimplentes",
    icon: TriangleAlert,
    visibleTo: BOTH,
  },
  { href: "/dashboard/renovacoes", label: "Renovações", icon: RefreshCw, visibleTo: BOTH },
  { href: "/dashboard/cursos", label: "Cursos", icon: ClipboardList, visibleTo: BOTH },
  {
    href: "/dashboard/relatorios",
    label: "Relatórios",
    icon: FileBarChart,
    visibleTo: BOTH,
  },
  {
    href: "/dashboard/instituicoes",
    label: "Instituições",
    icon: Building2,
    visibleTo: ADMIN_ONLY,
  },
  {
    href: "/dashboard/usuarios",
    label: "Usuários",
    icon: UserCog,
    visibleTo: ADMIN_ONLY,
  },
];

/**
 * Itens que este papel enxerga.
 *
 * Filtrar aqui é **cosmético**: evita mostrar ao gestor um link que ele não pode abrir.
 * Quem de fato barra é o `requireAdminSession()` dentro da página — esconder link nunca
 * foi controle de acesso, já que a URL continua digitável.
 */
export function navItemsFor(role: UserType): NavItem[] {
  return MANAGEMENT_NAV.filter((item) => item.visibleTo.includes(role));
}
