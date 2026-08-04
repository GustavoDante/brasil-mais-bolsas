import { FileValidator } from '@nestjs/common';
import { extname } from 'node:path';
import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MIN_UPLOAD_FILE_SIZE_BYTES,
} from '../constants/upload.constants';
import type { UploadedFileData } from '../types/uploaded-file.type';
import { detectFileType } from '../utils/file-signature.util';

export interface SecureFileValidationOptions {
  /** Tamanho maximo em bytes (default: `MAX_UPLOAD_FILE_SIZE_BYTES`) */
  maxSizeBytes?: number;
  /** Content-Types canonicos aceitos nesta rota (default: todos os de `ALLOWED_FILE_TYPES`) */
  allowedMimeTypes?: readonly string[];
}

type PartialFile = Partial<UploadedFileData>;

/**
 * Validador de upload usado com o `ParseFilePipe`.
 *
 * Diferente do `FileTypeValidator` do Nest (que depende do pacote ESM `file-type`,
 * incompativel com o Jest em modo CommonJS deste projeto), a checagem e feita com a
 * tabela de assinaturas em `common/constants/upload.constants.ts`.
 *
 * Regras aplicadas, em ordem:
 * 1. arquivo presente e com conteudo em memoria;
 * 2. tamanho dentro dos limites e coerente com o buffer recebido;
 * 3. tipo real reconhecido pelos magic numbers;
 * 4. tipo real dentro da lista permitida na rota;
 * 5. `mimetype` declarado pelo cliente compativel com o tipo real;
 * 6. extensao do nome original (quando houver) compativel com o tipo real.
 *
 * O validador e sem estado: `buildErrorMessage` recalcula o motivo a partir do arquivo,
 * pois a instancia criada no decorator e compartilhada entre requisicoes concorrentes.
 */
export class SecureFileValidator extends FileValidator<SecureFileValidationOptions> {
  isValid(file?: unknown): boolean {
    return this.check(file) === null;
  }

  buildErrorMessage(file: unknown): string {
    return this.check(file) ?? 'arquivo-invalido';
  }

  private get maxSizeBytes(): number {
    return this.validationOptions?.maxSizeBytes ?? MAX_UPLOAD_FILE_SIZE_BYTES;
  }

  /** Retorna a mensagem de erro ou `null` quando o arquivo e valido. */
  private check(file?: unknown): string | null {
    if (!file || typeof file !== 'object' || Array.isArray(file)) {
      return 'arquivo-obrigatorio';
    }

    const candidate = file as PartialFile;
    const buffer = candidate.buffer;

    if (!Buffer.isBuffer(buffer)) {
      return 'arquivo-nao-recebido-em-memoria';
    }

    if (buffer.length < MIN_UPLOAD_FILE_SIZE_BYTES) {
      return 'arquivo-vazio-ou-truncado';
    }

    if (buffer.length > this.maxSizeBytes) {
      return `arquivo-excede-o-tamanho-maximo-de-${Math.floor(this.maxSizeBytes / (1024 * 1024))}mb`;
    }

    // multer reporta `size`; divergencia em relacao ao buffer indica payload manipulado
    if (typeof candidate.size === 'number' && candidate.size !== buffer.length) {
      return 'tamanho-do-arquivo-inconsistente';
    }

    const detected = detectFileType(buffer);

    if (!detected) {
      return 'tipo-de-arquivo-nao-suportado';
    }

    const allowed = this.validationOptions?.allowedMimeTypes;

    if (allowed && !allowed.includes(detected.mime)) {
      return `tipo-de-arquivo-nao-permitido-nesta-rota-${detected.mime}`;
    }

    const declaredMime = candidate.mimetype?.split(';')[0]?.trim().toLowerCase();

    if (declaredMime && !detected.mimeAliases.includes(declaredMime)) {
      return 'content-type-declarado-nao-corresponde-ao-conteudo-do-arquivo';
    }

    const extension = candidate.originalname ? extname(candidate.originalname).toLowerCase() : '';

    if (extension && !detected.extensions.includes(extension)) {
      return 'extensao-do-arquivo-nao-corresponde-ao-conteudo';
    }

    return null;
  }
}
