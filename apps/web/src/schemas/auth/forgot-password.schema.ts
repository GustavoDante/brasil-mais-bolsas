/**
 * Schema de entrada de `forgot-password` (módulo auth).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form.
 */
import { z } from "zod";
import { ForgotPasswordSchema } from "@repo/contracts";

export const forgotPasswordInputSchema = ForgotPasswordSchema;

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
