import { RegisterSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * Cadastro público de aluno.
 *
 * O schema **não** tem `type`, `institution_id` nem `partner_id`: quem entra pela rota
 * pública é sempre `user`, e o vínculo com parceiro vem de `partner_code`, resolvido no
 * servidor. Como o schema é `.strict()`, mandar qualquer um desses campos devolve 400 — a
 * proteção contra escalada de privilégio é estrutural, não uma checagem no meio do handler
 * (era assim no projeto antigo).
 */
export class RegisterDto extends createZodDto(RegisterSchema) {}
