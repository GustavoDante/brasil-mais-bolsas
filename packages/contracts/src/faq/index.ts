import { z } from 'zod';

import { FaqSchema } from '../models';
import { zText } from '../primitives';

export const CreateFaqSchema = z
  .object({
    question: zText('Informe a pergunta'),
    answer: zText('Informe a resposta'),
  })
  .strict()
  .meta({ id: 'CreateFaq' });

export const UpdateFaqSchema = CreateFaqSchema.partial().strict().meta({ id: 'UpdateFaq' });

export const FaqResponseSchema = FaqSchema.meta({ id: 'FaqResponse' });

/**
 * A listagem responde ora em `faqs`, ora em `faq` conforme a rota — os dois nomes ficam
 * opcionais para o cliente aceitar qualquer uma sem quebrar.
 */
export const FaqListEnvelopeSchema = z
  .object({
    ok: z.boolean(),
    message: z.string().optional(),
    faqs: z.array(FaqResponseSchema).optional(),
    faq: z.array(FaqResponseSchema).optional(),
  })
  .meta({ id: 'FaqListEnvelope' });

export type CreateFaqInput = z.infer<typeof CreateFaqSchema>;
export type UpdateFaqInput = z.infer<typeof UpdateFaqSchema>;
export type FaqResponse = z.infer<typeof FaqResponseSchema>;
export type FaqListEnvelope = z.infer<typeof FaqListEnvelopeSchema>;
