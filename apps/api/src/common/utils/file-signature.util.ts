import { randomUUID } from 'node:crypto';
import {
  ALLOWED_FILE_TYPES,
  type AllowedFileType,
  type UploadFolder,
} from '../constants/upload.constants';

/**
 * Detecta o tipo real do arquivo pelos magic numbers, ignorando o `mimetype` e a extensao
 * informados pelo cliente. Retorna `null` quando o conteudo nao corresponde a nenhum tipo
 * permitido.
 */
export function detectFileType(buffer: Buffer): AllowedFileType | null {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return ALLOWED_FILE_TYPES.find((type) => type.matches(buffer)) ?? null;
}

/**
 * Normaliza o nome original do arquivo para uso em metadados/Content-Disposition.
 * Remove diretorios (`../`, `C:\`), caracteres de controle e qualquer coisa fora de
 * `[a-z0-9._-]`. O resultado NUNCA compoe a key do objeto — serve apenas como rotulo.
 */
export function sanitizeFileName(originalName: string): string {
  const withoutPath = originalName.split(/[\\/]/).pop() ?? '';

  const sanitized = withoutPath
    .normalize('NFKD')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 100);

  return sanitized.length > 0 ? sanitized : 'arquivo';
}

/**
 * Monta a key do objeto no bucket: `<pasta>/<ano>/<mes>/<uuid><extensao>`.
 *
 * A extensao vem do tipo detectado (nao do nome enviado), o identificador e aleatorio e a
 * pasta so pode ser um dos valores de `UPLOAD_FOLDERS` — assim nenhuma parte da key e
 * controlada por quem envia o arquivo.
 */
export function buildObjectKey(
  folder: UploadFolder,
  extension: string,
  now: Date = new Date(),
): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  return `${folder}/${year}/${month}/${randomUUID()}${extension}`;
}
