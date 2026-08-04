/**
 * Schema de entrada de `sign-in` (módulo auth).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zEmail, zPassword } from "@repo/contracts";

export const signInInputSchema = z.object({
  email: zEmail(),
  // A API aceita a senha ou o CPF (somente dígitos) do aluno.
  password: zPassword("Informe a senha ou o CPF"),
});

export type SignInInput = z.infer<typeof signInInputSchema>;
