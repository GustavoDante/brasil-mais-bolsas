import { z } from 'zod';

/**
 * Blocos de validação reutilizados por todos os schemas de request.
 *
 * Porte de `apps/web/src/actions/_core/schemas.ts`, que existia para "espelhar os
 * decorators do backend". Agora não espelha nada: é a definição, e os dois lados a usam.
 *
 * Convenção: `z*` valida um valor já no tipo certo (body JSON); `zQuery*` aceita a
 * string que chega na query/param e converte. A separação é o que substitui o
 * `transform: true` do `ValidationPipe` — sem ela, toda rota com filtro numérico passa a
 * rejeitar entrada válida.
 */

/** Identificador (cuid) obrigatório. */
export function zId(message: string) {
  return z.string({ error: message }).trim().min(1, { error: message });
}

/** Texto obrigatório, com tamanho mínimo/máximo opcionais. */
export function zText(message: string, options: { min?: number; max?: number } = {}) {
  let schema = z
    .string({ error: message })
    .trim()
    .min(options.min ?? 1, { error: message });
  if (options.max !== undefined) schema = schema.max(options.max, { error: message });
  return schema;
}

/** Texto opcional — string vazia é tratada como ausente. */
export function zOptionalText(options: { max?: number } = {}) {
  const base = options.max === undefined ? z.string() : z.string().max(options.max);
  return base
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();
}

export function zEmail(message = 'E-mail inválido') {
  return z.email({ error: message }).trim();
}

export function zOptionalEmail(message = 'E-mail inválido') {
  return z.email({ error: message }).trim().optional();
}

export function zBoolean(message = 'Valor inválido') {
  return z.boolean({ error: message });
}

export function zOptionalBoolean() {
  return z.boolean().optional();
}

export function zInt(message: string, options: { min?: number; max?: number } = {}) {
  let schema = z.number({ error: message }).int({ error: message });
  if (options.min !== undefined) schema = schema.min(options.min, { error: message });
  if (options.max !== undefined) schema = schema.max(options.max, { error: message });
  return schema;
}

export function zOptionalInt(options: { min?: number; max?: number } = {}) {
  let schema = z.number().int();
  if (options.min !== undefined) schema = schema.min(options.min);
  if (options.max !== undefined) schema = schema.max(options.max);
  return schema.optional();
}

/** Número decimal (preços, percentuais). */
export function zAmount(message: string, options: { min?: number } = {}) {
  return z.number({ error: message }).min(options.min ?? 0, { error: message });
}

export function zOptionalAmount(options: { min?: number } = {}) {
  return z
    .number()
    .min(options.min ?? 0)
    .optional();
}

/** Data em string ISO 8601 — equivale ao antigo `@IsDateString()`. */
export function zDateString(message = 'Data inválida') {
  return z
    .string({ error: message })
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), { error: message });
}

export function zOptionalDateString(message = 'Data inválida') {
  return zDateString(message).optional();
}

/**
 * Data que chega como string ISO e o handler recebe como `Date`.
 * Substitui o par `@Type(() => Date)` + `@IsDate()` dos DTOs antigos.
 */
export function zDateInput(message = 'Data inválida') {
  return zDateString(message).transform((value) => new Date(value));
}

export function zOptionalDateInput(message = 'Data inválida') {
  return zDateInput(message).optional();
}

/** Sigla de estado (2 letras). */
export function zState(message = 'Informe a UF com 2 letras') {
  return z
    .string({ error: message })
    .trim()
    .length(2, { error: message })
    .transform((value) => value.toUpperCase());
}

/** CPF ou CNPJ em texto (11 a 18 caracteres, com ou sem máscara). */
export function zDocument(message = 'Documento inválido') {
  return z
    .string({ error: message })
    .trim()
    .min(11, { error: message })
    .max(18, { error: message });
}

/** CPF — 11 a 14 caracteres, com ou sem máscara. */
export function zCpf(message = 'CPF inválido') {
  return z
    .string({ error: message })
    .trim()
    .min(11, { error: message })
    .max(14, { error: message });
}

/**
 * Número em texto — equivale ao antigo `@IsNumberString()`.
 * Usado onde o valor trafega como string para não perder precisão (ex.: `family_income`).
 */
export function zNumericString(message = 'Valor numérico inválido') {
  return z
    .string({ error: message })
    .trim()
    .regex(/^-?\d+(?:[.,]\d+)?$/, { error: message });
}

/** Senha — mínimo de 6 caracteres. */
export function zPassword(message = 'A senha precisa ter ao menos 6 caracteres') {
  return z.string({ error: message }).min(6, { error: message });
}

/**
 * Senha de redefinição — mínimo 8, máximo 72.
 * O teto não é estético: o bcrypt ignora o que passa de 72 bytes, e truncar em silêncio
 * faria a senha aceita no cadastro não bater no login.
 */
export function zStrongPassword(message = 'A senha deve ter no mínimo 8 caracteres') {
  return z.string({ error: message }).min(8, { error: message }).max(72, { error: message });
}

/**
 * `z.enum` exige uma tupla (`[string, ...string[]]`), mas os enums gerados expõem os
 * valores como array simples (`ScholarshipTypeSchema.options`). Estes helpers aceitam
 * qualquer array de literais e concentram a conversão num ponto só — sem isso, cada
 * chamada precisaria de um cast.
 */
export function zEnumValue<T extends string>(values: readonly T[], message: string) {
  return z.enum(values as unknown as [T, ...T[]], { error: message });
}

export function zOptionalEnumValue<T extends string>(values: readonly T[], message: string) {
  return zEnumValue(values, message).optional();
}

export function zStringArray() {
  return z.array(z.string().trim().min(1)).optional();
}

/**
 * Valor monetário no formato wire: o Prisma serializa `Decimal` como string.
 * Aceita number por conveniência de quem monta o payload em JS.
 */
export function zDecimalish(message = 'Valor inválido') {
  return z.union([z.string({ error: message }), z.number({ error: message })]);
}

// --- Valores que chegam como texto ---------------------------------------------------
// Query string (`?a=b`) e `multipart/form-data` entregam **tudo** como string. Estes
// blocos fazem a coerção que o `ValidationPipe({ transform: true })` fazia implicitamente.
// Use-os em qualquer campo que possa chegar por uma dessas duas vias — inclusive em body,
// quando a rota aceita `multipart` (ex.: instituições, que sobem a logo junto do JSON).

export function zQueryInt(options: { min?: number; max?: number } = {}) {
  let schema = z.coerce.number().int();
  if (options.min !== undefined) schema = schema.min(options.min);
  if (options.max !== undefined) schema = schema.max(options.max);
  return schema;
}

export function zQueryOptionalInt(options: { min?: number; max?: number } = {}) {
  return zQueryInt(options).optional();
}

export function zQueryAmount(options: { min?: number } = {}) {
  return z.coerce.number().min(options.min ?? 0);
}

export function zQueryOptionalAmount(options: { min?: number } = {}) {
  return zQueryAmount(options).optional();
}

/** `?flag=true` / `?flag=1` — o que a query string realmente entrega. */
export function zQueryOptionalBoolean() {
  return z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((value) => value === true || value === 'true' || value === '1')
    .optional();
}

/** Lista separada por vírgula (`?modalidade=EAD,PRESENCIAL`). */
export function zQueryCsv<T extends string>(values: readonly T[]) {
  const enumSchema = z.enum(values as unknown as [T, ...T[]]);

  return z
    .union([z.array(enumSchema), z.string()])
    .transform((value) =>
      Array.isArray(value)
        ? value
        : value
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean),
    )
    .pipe(z.array(enumSchema))
    .optional();
}
