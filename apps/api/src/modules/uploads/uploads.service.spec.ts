import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { StorageService } from '../../integrations/storage/storage.service';
import { UploadsService } from './uploads.service';

const makeFile = (overrides: Partial<UploadedFileData> = {}): UploadedFileData => {
  const buffer =
    overrides.buffer ??
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(32),
    ]);

  return {
    fieldname: 'file',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: buffer.length,
    ...overrides,
    buffer,
  };
};

describe('UploadsService', () => {
  let service: UploadsService;
  let storage: { upload: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    storage = {
      upload: jest.fn().mockResolvedValue({
        key: 'institutions/2026/07/arquivo.png',
        url: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
        contentType: 'image/png',
        size: 40,
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [UploadsService, { provide: StorageService, useValue: storage }],
    }).compile();

    service = module.get(UploadsService);
  });

  describe('upload', () => {
    it('deve subir o arquivo usando o tipo detectado pelo conteudo', async () => {
      const result = await service.upload(makeFile({ mimetype: 'image/gif' }), 'institutions');

      expect(storage.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image/png',
          extension: '.png',
          folder: 'institutions',
          originalName: 'logo.png',
        }),
      );
      expect(result.url).toContain('institutions/2026/07/arquivo.png');
    });

    it('deve usar a pasta padrao quando nenhuma for informada', async () => {
      await service.upload(makeFile());

      expect(storage.upload).toHaveBeenCalledWith(expect.objectContaining({ folder: 'misc' }));
    });

    it('deve recusar conteudo nao identificado sem chamar o S3', async () => {
      const file = makeFile({ buffer: Buffer.from('conteudo qualquer sem assinatura') });

      await expect(service.upload(file)).rejects.toThrow(UnprocessableEntityException);
      expect(storage.upload).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve repassar a key para o storage', async () => {
      await service.remove('misc/2026/07/arquivo.png');

      expect(storage.remove).toHaveBeenCalledWith('misc/2026/07/arquivo.png');
    });
  });
});
