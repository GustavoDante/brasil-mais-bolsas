import { z } from 'zod';

/**
 * Os três papéis de `User.type`.
 *
 * Fica **fora** de `enums.ts` de propósito: aquele arquivo só reexporta enums gerados do
 * `schema.prisma`, e `User.type` é `String @default("user")` — não é um enum do Prisma.
 * Uma constante escrita à mão lá dentro quebraria a invariante do arquivo ("acrescentar um
 * valor no Prisma propaga sozinho").
 *
 * Antes disso o conjunto fechado existia uma vez só, inline no `AdminUpdateUserSchema`,
 * e `CreateUserSchema` aceitava `z.string()` — ou seja, `POST /v1/users` gravava qualquer
 * string como papel.
 *
 * **Só para entrada.** Schema de resposta (`AuthProfileSchema`, `UserSafeSchema`) mantém
 * `z.string()`: ninguém os valida em runtime, e apertar o tipo faria o compilador afirmar
 * um conjunto fechado que uma linha legada pode não respeitar. Quem consome estreita uma
 * vez, explicitamente (no web é o `resolveUserType`).
 */
export const USER_TYPES = ['admin', 'manager', 'user'] as const;

export const UserTypeSchema = z.enum(USER_TYPES);

export type UserType = z.infer<typeof UserTypeSchema>;
