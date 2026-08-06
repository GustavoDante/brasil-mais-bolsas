import { UserTypeSchema, type UserType } from "@repo/contracts";

/**
 * Vocabulário de papel do frontend — isomórfico.
 *
 * Depende **só** de `@repo/contracts`. Nada de `next/headers`, `next/navigation` ou
 * `@/lib/api/*`: é o que permite que o formulário de login (componente de cliente) e os
 * layouts privados (servidor) compartilhem exatamente as mesmas regras. Guarda que
 * redireciona é outra coisa e mora em `./guards` — servidor apenas.
 */

export type { UserType };

/** Painel de admin e gestor. Mesmas telas; o admin vê e pode mais. */
export const MANAGEMENT_HOME = "/dashboard";

/** Painel do aluno (ou do responsável pelos menores). */
export const STUDENT_HOME = "/aluno";

export type PrivateHome = typeof MANAGEMENT_HOME | typeof STUDENT_HOME;

/**
 * Estreita o `type` que veio da API para um dos três papéis conhecidos.
 *
 * `User.type` é `String` no banco, não enum, e a base carrega dados migrados do sistema
 * antigo — então um valor inesperado é possível. O padrão é `"user"` de propósito: menor
 * privilégio. Um papel desconhecido cai no painel do aluno em vez de escorregar por um
 * `switch` e virar `undefined` no meio de uma checagem de permissão.
 */
export function resolveUserType(value: string | null | undefined): UserType {
  const parsed = UserTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "user";
}

export function isAdmin(value: string | null | undefined): boolean {
  return resolveUserType(value) === "admin";
}

export function isManager(value: string | null | undefined): boolean {
  return resolveUserType(value) === "manager";
}

/** Admin e gestor: quem entra no backoffice. */
export function isManagement(value: string | null | undefined): boolean {
  const type = resolveUserType(value);
  return type === "admin" || type === "manager";
}

export function isStudent(value: string | null | undefined): boolean {
  return resolveUserType(value) === "user";
}

/**
 * Para onde mandar alguém que acabou de autenticar e não pediu destino nenhum.
 *
 * Só vale como **fallback**: um `callbackUrl` válido sempre ganha, senão quem clica num
 * link protegido, loga e é jogado na home perde o destino que pediu.
 */
export function homeRouteFor(value: string | null | undefined): PrivateHome {
  return isManagement(value) ? MANAGEMENT_HOME : STUDENT_HOME;
}
