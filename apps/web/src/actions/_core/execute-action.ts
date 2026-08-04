import { updateTag } from "next/cache";
import type { ZodType } from "zod";
import { z } from "zod";
import { getSessionToken } from "@/lib/api/session";
import {
  ACTION_ERROR_CODES,
  buildActionError,
  normalizeError,
} from "./action-error";
import {
  actionFailure,
  actionSuccess,
  notAuthenticated,
  type ActionResult,
} from "./action-result";

/** `required` exige sessão; `optional` envia o token se houver; `none` nunca envia. */
export type ActionAuth = "required" | "optional" | "none";

export interface ActionContext {
  /** Access token da sessão (null em rotas públicas ou visitante). */
  token: string | null;
}

export interface ExecuteActionParams<TInput, TOutput> {
  /** Entrada crua recebida do chamador. */
  input: TInput;
  /** Schema que valida a entrada antes de qualquer chamada de rede. */
  schema: ZodType<TInput>;
  auth: ActionAuth;
  /** Chamada à API já com a entrada validada. */
  run: (input: TInput, context: ActionContext) => Promise<TOutput>;
  /** Mensagem de sucesso exibível. */
  successMessage?: string;
  /** Tags de cache invalidadas após sucesso (mutações). */
  revalidateTags?: string[];
}

/**
 * Pipeline padrão de toda action:
 *
 * 1. valida a entrada com zod → `validation-error` com `fieldErrors`;
 * 2. resolve a sessão → `not-authenticated` quando `auth: "required"` e não há token;
 * 3. executa a chamada à API;
 * 4. em sucesso, invalida as tags de cache e devolve `{ ok: true, data }`;
 * 5. em erro, normaliza para `{ ok: false, error: { code, message, status } }` —
 *    o código vem do backend quando existe, senão cai no padrão por status e, em último
 *    caso, em `unknown-error`.
 */
export async function executeAction<TInput, TOutput>({
  input,
  schema,
  auth,
  run,
  successMessage,
  revalidateTags,
}: ExecuteActionParams<TInput, TOutput>): Promise<ActionResult<TOutput>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return actionFailure(
      buildActionError({
        code: ACTION_ERROR_CODES.validation,
        status: 422,
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
          string,
          string[]
        >,
      }),
    );
  }

  let token: string | null = null;

  if (auth !== "none") {
    token = await getSessionToken();
    if (!token && auth === "required") return notAuthenticated();
  }

  try {
    const data = await run(parsed.data, { token });

    // `updateTag` (Next 16) invalida a tag e já entrega o dado novo na mesma resposta
    // (read-your-own-writes) — é a função pensada para Server Actions.
    if (revalidateTags?.length) {
      for (const tag of revalidateTags) updateTag(tag);
    }

    return actionSuccess(data, successMessage);
  } catch (error) {
    return actionFailure(normalizeError(error));
  }
}
