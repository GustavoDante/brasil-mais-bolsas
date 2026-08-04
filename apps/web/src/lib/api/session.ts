/**
 * Sessão do usuário — SOMENTE SERVIDOR.
 *
 * O access token vive num cookie `httpOnly`, então JavaScript do browser nunca o enxerga.
 * Este módulo usa `next/headers`; importá-lo de um Client Component quebra o build de
 * propósito. Componentes do cliente que precisam de dados autenticados devem passar por
 * Server Actions (`src/actions`).
 *
 * `setSessionToken`/`clearSessionToken` só podem ser chamados dentro de Server Actions ou
 * Route Handlers — é a restrição do Next para escrita de cookies.
 */
import { cookies } from "next/headers";
import { apiConfig } from "./config";

/** 24h — mesmo padrão do `JWT_EXPIRES_IN` da API. */
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24;

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(apiConfig.sessionCookieName)?.value ?? null;
}

export async function setSessionToken(
  token: string,
  { maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS }: { maxAgeSeconds?: number } = {}
): Promise<void> {
  const store = await cookies();

  store.set(apiConfig.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(apiConfig.sessionCookieName);
}
