/**
 * Schema de entrada de `reset-password` (módulo auth).
 *
 * O `.refine` que compara `password` e `repassword` vem junto do contrato, então a
 * divergência é apontada no formulário antes de qualquer requisição.
 */
import { z } from "zod";
import { ResetPasswordSchema } from "@repo/contracts";

export const resetPasswordInputSchema = ResetPasswordSchema;

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
