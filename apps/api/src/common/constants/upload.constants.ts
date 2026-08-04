/**
 * Regras de upload de arquivos (imagens e PDFs) usadas pelo `SecureFileValidator` e pelo
 * `StorageService`.
 *
 * O projeto antigo aceitava qualquer arquivo cujo `mimetype` enviado pelo cliente
 * comecasse com `image/` (`src/services/uploadImage.js`). Como o `mimetype` e o nome do
 * arquivo sao controlados por quem envia a requisicao, aqui a checagem e feita pelos
 * **magic numbers** (assinatura binaria) do conteudo — o `mimetype` declarado so e aceito
 * quando bate com o tipo realmente detectado.
 */

const startsWith = (buffer: Buffer, offset: number, bytes: readonly number[]): boolean => {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => buffer[offset + index] === byte);
};

const hasAscii = (buffer: Buffer, offset: number, text: string): boolean =>
  startsWith(
    buffer,
    offset,
    [...text].map((char) => char.charCodeAt(0)),
  );

export interface AllowedFileType {
  /** Content-Type canonico gravado no S3 */
  readonly mime: string;
  /** Extensao usada na key do objeto (a primeira e a canonica) */
  readonly extensions: readonly string[];
  /** Aliases de `mimetype` que o cliente pode declarar para este tipo */
  readonly mimeAliases: readonly string[];
  /** Verificacao da assinatura binaria do arquivo */
  readonly matches: (buffer: Buffer) => boolean;
}

/**
 * Tipos aceitos. `image/svg+xml` foi deliberadamente removido em relacao ao projeto
 * antigo: SVG e um documento XML capaz de executar script quando servido pelo dominio do
 * bucket (XSS armazenado) e nao possui magic number confiavel.
 */
export const ALLOWED_FILE_TYPES: readonly AllowedFileType[] = [
  {
    mime: 'image/png',
    extensions: ['.png'],
    mimeAliases: ['image/png'],
    matches: (buffer) => startsWith(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mime: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    mimeAliases: ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    matches: (buffer) => startsWith(buffer, 0, [0xff, 0xd8, 0xff]),
  },
  {
    mime: 'image/gif',
    extensions: ['.gif'],
    mimeAliases: ['image/gif'],
    matches: (buffer) => hasAscii(buffer, 0, 'GIF87a') || hasAscii(buffer, 0, 'GIF89a'),
  },
  {
    mime: 'image/webp',
    extensions: ['.webp'],
    mimeAliases: ['image/webp'],
    // RIFF....WEBP — os 4 bytes entre os marcadores sao o tamanho do arquivo
    matches: (buffer) => hasAscii(buffer, 0, 'RIFF') && hasAscii(buffer, 8, 'WEBP'),
  },
  {
    mime: 'application/pdf',
    extensions: ['.pdf'],
    mimeAliases: ['application/pdf'],
    matches: (buffer) => hasAscii(buffer, 0, '%PDF-'),
  },
];

/** Apenas imagens — usado nos uploads de logo/foto (instituicoes, bolsas, etc.) */
export const IMAGE_MIME_TYPES: readonly string[] = ALLOWED_FILE_TYPES.filter((type) =>
  type.mime.startsWith('image/'),
).map((type) => type.mime);

/** Tamanho maximo aceito por arquivo (5 MB) */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Menor arquivo plausivel — evita gastar chamada ao S3 com arquivo vazio/truncado */
export const MIN_UPLOAD_FILE_SIZE_BYTES = 16;

/**
 * Prefixos permitidos na key e formato exato dela (`pasta/ano/mes/uuid.ext`).
 *
 * Vem de `@repo/contracts` porque sao **contrato de request**: o frontend precisa dos
 * mesmos valores para montar o formulario de upload. A deteccao de tipo por magic number
 * continua sendo responsabilidade deste app (ver `ALLOWED_FILE_TYPES` acima).
 */
export {
  DEFAULT_UPLOAD_FOLDER,
  UPLOAD_FOLDERS,
  UPLOAD_KEY_PATTERN,
  type UploadFolder,
} from '@repo/contracts';
