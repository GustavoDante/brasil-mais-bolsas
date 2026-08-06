import {
  Bell,
  CreditCard,
  GraduationCap,
  Heart,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface StudentNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Menu do aluno.
 *
 * Sem filtro por papel: quem chega aqui já passou pela `requireStudentSession()`, então
 * todos os itens valem para todo mundo do grupo. É a diferença que justifica um arquivo
 * próprio em vez de reaproveitar o `nav-items` do backoffice.
 */
export const STUDENT_NAV: readonly StudentNavItem[] = [
  { href: "/aluno", label: "Início", icon: LayoutDashboard },
  { href: "/aluno/minhas-bolsas", label: "Minhas bolsas", icon: GraduationCap },
  { href: "/aluno/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/aluno/indicacoes", label: "Indicações", icon: Heart },
  { href: "/aluno/notificacoes", label: "Notificações", icon: Bell },
  { href: "/aluno/meu-perfil", label: "Meu perfil", icon: UserRound },
];
