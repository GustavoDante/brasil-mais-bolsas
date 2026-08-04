import { z } from 'zod';

import { zEmail, zText } from '../primitives';

/**
 * Origem do contato. Determina **no servidor** para qual caixa a mensagem é encaminhada.
 */
export const CONTACT_TYPES = ['souAluno', 'queroSerAluno', 'souParceiro'] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const ContactTypeSchema = z.enum(CONTACT_TYPES);

/**
 * `POST /v1/contact` — mensagem para o suporte da plataforma.
 *
 * **Não existe `targetEmail` aqui, de propósito.** O destino sai de `type` pela
 * configuração do servidor. Aceitar o destinatário do cliente transformaria a rota — que é
 * pública e sem autenticação — em relay aberto: qualquer um mandaria e-mail para qualquer
 * endereço saindo do domínio da plataforma, queimando a reputação de envio e servindo de
 * vetor de phishing.
 */
export const ContactRequestSchema = z
  .object({
    name: zText('Informe o nome', { min: 2, max: 120 }),
    email: zEmail(),
    phone: zText('Informe o telefone com DDD', { min: 10, max: 20 }),
    subject: zText('Informe o assunto', { min: 3, max: 150 }),
    message: zText('Escreva a mensagem', { min: 10, max: 5000 }),
    type: ContactTypeSchema.optional(),
  })
  .strict()
  .meta({ id: 'ContactRequest', description: 'Mensagem de contato com o suporte' });

export const ContactResponseSchema = z
  .object({
    ok: z.boolean(),
    message: z.string(),
  })
  .meta({ id: 'ContactResponse' });

export type ContactRequestInput = z.infer<typeof ContactRequestSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
