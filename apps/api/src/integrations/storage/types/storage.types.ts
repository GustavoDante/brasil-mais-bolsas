import type { UploadFolder } from '../../../common/constants/upload.constants';

export interface StorageUploadInput {
  /** Conteudo do arquivo ja validado */
  buffer: Buffer;
  /** Content-Type canonico detectado pelos magic numbers */
  contentType: string;
  /** Extensao canonica do tipo detectado (inclui o ponto) */
  extension: string;
  /** Prefixo da key no bucket */
  folder: UploadFolder;
  /** Nome enviado pelo cliente — gravado apenas como metadado, ja sanitizado */
  originalName?: string;
}

export interface StoredFile {
  /** Key completa do objeto dentro do bucket */
  key: string;
  /** URL publica do arquivo (e o que fica salvo no banco) */
  url: string;
  contentType: string;
  size: number;
}
