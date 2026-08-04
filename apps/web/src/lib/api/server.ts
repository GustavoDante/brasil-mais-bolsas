/**
 * Helpers de sessão para Server Components e Server Actions — SOMENTE SERVIDOR.
 *
 * ```ts
 * const session = await getServerSession();
 * if (!session) redirect("/login");
 * const orders = await api.orders.list({ token: session.token });
 * ```
 */
import { cache } from "react";
import { api } from "./index";
import type { AuthProfileDto } from "./dto";
import { ApiError, isApiError } from "./errors";
import { getSessionToken } from "./session";

export interface ServerSession {
  token: string;
  user: AuthProfileDto;
}

/**
 * Sessão atual, ou `null` se não houver token válido.
 * Memoizado por requisição (`cache`), então várias chamadas no mesmo render
 * batem uma única vez em `GET /v1/auth/me`.
 */
export const getServerSession = cache(async (): Promise<ServerSession | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const user = await api.auth.me(token);
    return { token, user };
  } catch (error) {
    // Token expirado/inválido: trata como visitante em vez de derrubar a página.
    if (isApiError(error) && (error.isUnauthorized || error.isForbidden)) return null;
    throw error;
  }
});

/** Igual a `getServerSession`, mas lança 401 quando não há sessão. */
export async function requireServerSession(): Promise<ServerSession> {
  const session = await getServerSession();

  if (!session) {
    throw new ApiError({
      kind: "http",
      status: 401,
      message: "sessao-nao-encontrada",
    });
  }

  return session;
}

export { getSessionToken, setSessionToken, clearSessionToken } from "./session";
