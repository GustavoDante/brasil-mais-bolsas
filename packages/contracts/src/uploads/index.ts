import { z } from 'zod';

/**
 * Pastas permitidas no bucket. Lista fechada: o caminho do objeto nunca pode ser montado
 * com dado livre da requisição (path traversal / sobrescrita de key).
 *
 * Fica aqui porque é **contrato de request** — o frontend precisa saber os valores válidos.
 * A detecção de tipo por magic number continua sendo responsabilidade da API
 * (`apps/api/src/common/constants/upload.constants.ts`), que deve importar esta lista em
 * vez de manter a sua.
 */
export const UPLOAD_FOLDERS = [
  'institutions',
  'scholarships',
  'users',
  'contracts',
  'misc',
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const DEFAULT_UPLOAD_FOLDER: UploadFolder = 'misc';

/** Extensões aceitas. SVG é proibido de propósito: XSS armazenado no domínio do bucket. */
export const UPLOAD_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf'] as const;

/**
 * Formato exato das keys geradas pelo upload (`pasta/ano/mês/uuid.ext`). A remoção só
 * aceita keys nesse formato, para a rota nunca virar ferramenta de apagar objeto arbitrário.
 */
export const UPLOAD_KEY_PATTERN = new RegExp(
  `^(?:${UPLOAD_FOLDERS.join('|')})/\\d{4}/\\d{2}/` +
    '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' +
    `(?:${UPLOAD_EXTENSIONS.map((extension) => extension.replace('.', '\\.')).join('|')})$`,
);

export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const UploadFileSchema = z
  .object({
    folder: z.enum(UPLOAD_FOLDERS).optional(),
  })
  .meta({ id: 'UploadFile' });

export const DeleteFileSchema = z
  .object({
    key: z.string().regex(UPLOAD_KEY_PATTERN, { error: 'key-invalida' }),
  })
  .strict()
  .meta({ id: 'DeleteFile' });

export const UploadedFileResponseSchema = z
  .object({
    ok: z.boolean(),
    key: z.string(),
    url: z.string(),
  })
  .meta({ id: 'UploadedFileResponse' });

export const DeleteFileResponseSchema = z
  .object({
    ok: z.boolean(),
  })
  .meta({ id: 'DeleteFileResponse' });

export type UploadFileInput = z.infer<typeof UploadFileSchema>;
export type DeleteFileInput = z.infer<typeof DeleteFileSchema>;
export type UploadedFileResponse = z.infer<typeof UploadedFileResponseSchema>;
