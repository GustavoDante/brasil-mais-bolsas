import { z } from 'zod';

/**
 * Envelope padrão das respostas da API: todo endpoint devolve `{ ok, ...dado }`, e o
 * cliente HTTP do web já conta com esse formato.
 */
export const ApiOkSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
});

export type ApiOk = z.infer<typeof ApiOkSchema>;

/**
 * Monta `{ ok, message?, <key>: <schema> }`.
 *
 * Existe para que o formato do envelope seja declarado uma vez só: mudar a forma da
 * resposta padrão vira uma edição aqui, não em 138 lugares.
 */
export function apiEnvelope<Key extends string, Schema extends z.ZodType>(
  key: Key,
  schema: Schema,
) {
  return ApiOkSchema.extend({ [key]: schema } as { [P in Key]: Schema });
}

/** Entidade reduzida a `{ id, name }`, usada nos selects e autocompletes. */
export const NamedEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type NamedEntity = z.infer<typeof NamedEntitySchema>;

/** Campos `Decimal` do Prisma chegam serializados como string. */
export type Decimalish = string | number;

/** Datas chegam como string ISO 8601. */
export type IsoDate = string;
