import { Injectable } from '@nestjs/common';
import { DEFAULT_UPLOAD_FOLDER, type UploadFolder } from '../../common/constants/upload.constants';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { detectFileType } from '../../common/utils/file-signature.util';
import { StorageService } from '../../integrations/storage/storage.service';
import type { StoredFile } from '../../integrations/storage/types/storage.types';
import { AppException } from '../../common/exceptions/app.exception';

/**
 * Ponto unico de entrada para subir arquivos ao bucket. Qualquer modulo que precise
 * guardar imagem/PDF deve passar por aqui em vez de falar direto com o `StorageService`,
 * garantindo que o tipo seja sempre confirmado pelo conteudo do arquivo.
 */
@Injectable()
export class UploadsService {
  constructor(private readonly storageService: StorageService) {}

  async upload(
    file: UploadedFileData,
    folder: UploadFolder = DEFAULT_UPLOAD_FOLDER,
  ): Promise<StoredFile> {
    const detected = detectFileType(file.buffer);

    // Rotas usam o SecureFileValidator antes de chegar aqui; esta checagem cobre chamadas
    // internas (jobs, scripts) e evita gravar no bucket um conteudo nao identificado.
    if (!detected) {
      throw new AppException('unsupported-file-type');
    }

    return this.storageService.upload({
      buffer: file.buffer,
      contentType: detected.mime,
      extension: detected.extensions[0],
      folder,
      originalName: file.originalname,
    });
  }

  async remove(key: string): Promise<void> {
    await this.storageService.remove(key);
  }
}
