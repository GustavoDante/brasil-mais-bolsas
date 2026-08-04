import {
  ACTION_ERROR_CODES,
  buildActionError,
  type ActionError,
} from "./action-error";

/**
 * Envelope único de retorno de TODAS as actions.
 *
 * Nada de exceção atravessando a fronteira servidor → cliente: sucesso e erro têm sempre
 * a mesma forma, e o `ok` discrimina o tipo (o TypeScript estreita `data` e `error`).
 */
export interface ActionSuccess<TData> {
  ok: true;
  data: TData;
  /** Mensagem de sucesso pronta para exibir (quando faz sentido). */
  message?: string;
}

export interface ActionFailure {
  ok: false;
  error: ActionError;
}

export type ActionResult<TData = null> = ActionSuccess<TData> | ActionFailure;

export function actionSuccess<TData>(
  data: TData,
  message?: string,
): ActionSuccess<TData> {
  return message === undefined
    ? { ok: true, data }
    : { ok: true, data, message };
}

export function actionFailure(error: ActionError): ActionFailure {
  return { ok: false, error };
}

export function isActionSuccess<TData>(
  result: ActionResult<TData>,
): result is ActionSuccess<TData> {
  return result.ok;
}

export function isActionFailure<TData>(
  result: ActionResult<TData>,
): result is ActionFailure {
  return !result.ok;
}

/** Estado inicial para `useActionState`. */
export const actionIdle: ActionResult<null> = { ok: true, data: null };

/**
 * Devolve os dados ou lança — atalho para Server Components, onde um erro deve subir
 * para o `error.tsx` mais próximo em vez de virar estado de tela.
 */
export function unwrapAction<TData>(result: ActionResult<TData>): TData {
  if (result.ok) return result.data;

  const error = new Error(result.error.message);
  error.name = result.error.code;
  throw error;
}

/** Dados em caso de sucesso, ou o fallback informado em caso de erro. */
export function actionDataOr<TData>(
  result: ActionResult<TData>,
  fallback: TData,
): TData {
  return result.ok ? result.data : fallback;
}

/** Erro pronto para quando a action é chamada sem sessão. */
export function notAuthenticated(): ActionFailure {
  return actionFailure(
    buildActionError({ code: ACTION_ERROR_CODES.unauthenticated, status: 401 }),
  );
}
