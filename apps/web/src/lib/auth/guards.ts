/**
 * Guardas de papel para rotas privadas — SOMENTE SERVIDOR.
 *
 * ```ts
 * // app/(private)/(management)/layout.tsx
 * const session = await requireManagementSession();
 * ```
 *
 * As três funções **redirecionam**, não lançam. Aluno que abre um `/dashboard` antigo
 * salvo nos favoritos, ou admin que recebeu um `?callbackUrl=/aluno`, é navegação comum —
 * lançar levaria ao `error.tsx`, uma tela de falha para um caso cujo desfecho certo é
 * "você já está logado, sua casa é aqui".
 *
 * `redirect()` funciona lançando um sinal de controle do Next: **nunca** chame estas
 * funções dentro de um `try/catch` que engula exceção, senão o redirecionamento some.
 *
 * Autenticação (ter sessão) continua sendo do `(private)/layout.tsx`; aqui se decide só
 * qual papel entra em qual painel. `getServerSession()` é memoizada por requisição, então
 * layout, guarda e página juntos custam uma chamada só a `GET /v1/auth/me`.
 */
import { redirect } from "next/navigation";

import { getServerSession, type ServerSession } from "@/lib/api/server";
import {
  MANAGEMENT_HOME,
  STUDENT_HOME,
  homeRouteFor,
  isAdmin,
  isManagement,
  isStudent,
  resolveUserType,
  type UserType,
} from "./roles";

export interface RoleSession extends ServerSession {
  /** `user.type` já estreitado para um dos três papéis. */
  role: UserType;
  /** Instituição do gestor. `null` para admin e aluno. */
  institutionId: string | null;
}

async function requireRoleSession(): Promise<RoleSession> {
  const session = await getServerSession();

  // O `(private)/layout.tsx` já barrou quem não tem sessão; se chegou aqui sem, o token
  // venceu no meio do render — mandar para o login é a única saída correta.
  if (!session) redirect("/entrar");

  return {
    ...session,
    role: resolveUserType(session.user.type),
    institutionId: session.user.institution_id ?? null,
  };
}

/** Admin ou gestor. Aluno é devolvido para o painel dele. */
export async function requireManagementSession(): Promise<RoleSession> {
  const session = await requireRoleSession();
  if (!isManagement(session.role)) redirect(homeRouteFor(session.role));

  return session;
}

/**
 * Só admin.
 *
 * O gestor vai para `MANAGEMENT_HOME`, e não para `homeRouteFor(role)`: o painel dele é
 * este mesmo, só sem esta tela. Mandá-lo para `/aluno` criaria um pingue-pongue com a
 * guarda de aluno.
 */
export async function requireAdminSession(): Promise<RoleSession> {
  const session = await requireManagementSession();
  if (!isAdmin(session.role)) redirect(MANAGEMENT_HOME);

  return session;
}

/** Só aluno. Admin e gestor são devolvidos para o backoffice. */
export async function requireStudentSession(): Promise<RoleSession> {
  const session = await requireRoleSession();
  if (!isStudent(session.role)) redirect(MANAGEMENT_HOME);

  return session;
}

export { MANAGEMENT_HOME, STUDENT_HOME };
