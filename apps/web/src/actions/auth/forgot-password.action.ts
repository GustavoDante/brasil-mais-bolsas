"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ApiOkResponse } from "@/lib/api/dto";
import {
  forgotPasswordInputSchema,
  type ForgotPasswordInput,
} from "@/schemas/auth/forgot-password.schema";

/**
 * `POST /v1/auth/forgot_password` — dispara o e-mail com o link de redefinição.
 *
 * A API responde igual exista ou não a conta, para a rota não virar um verificador de
 * e-mails cadastrados. A tela precisa manter essa propriedade: nada de ramificar a
 * mensagem por resultado.
 */
export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: forgotPasswordInputSchema,
    auth: "none",
    successMessage:
      "Se este e-mail estiver cadastrado, você receberá as instruções em instantes.",
    run: async (data) => {
      await apiRequest<ApiOkResponse>("/auth/forgot_password", {
        method: "POST",
        body: data,
      });

      return null;
    },
  });
}
