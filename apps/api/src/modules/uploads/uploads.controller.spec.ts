import { Test } from '@nestjs/testing';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-id-1', email: 'user@test.com', type: 'user' };

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

const file: UploadedFileData = {
  fieldname: 'file',
  originalname: 'logo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 40,
  buffer: Buffer.alloc(40),
};

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: jest.Mocked<UploadsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: { upload: jest.fn(), remove: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(UploadsController);
    service = module.get(UploadsService);
  });

  describe('upload', () => {
    it('deve devolver url, key, content_type e size', async () => {
      service.upload.mockResolvedValue({
        key: 'institutions/2026/07/arquivo.png',
        url: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
        contentType: 'image/png',
        size: 40,
      });

      const result = await controller.upload(file, { folder: 'institutions' });

      expect(service.upload).toHaveBeenCalledWith(file, 'institutions');
      expect(result).toEqual({
        url: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
        key: 'institutions/2026/07/arquivo.png',
        content_type: 'image/png',
        size: 40,
      });
    });

    it('deve usar a pasta padrao quando o campo folder nao vier', async () => {
      service.upload.mockResolvedValue({
        key: 'misc/2026/07/arquivo.png',
        url: 'https://bucket.s3.sa-east-1.amazonaws.com/misc/2026/07/arquivo.png',
        contentType: 'image/png',
        size: 40,
      });

      await controller.upload(file, {});

      expect(service.upload).toHaveBeenCalledWith(file, 'misc');
    });
  });

  describe('remove', () => {
    it('deve remover o arquivo para admin', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(
        { key: 'misc/2026/07/arquivo.png' },
        makeReq(adminJwt),
      );

      expect(service.remove).toHaveBeenCalledWith('misc/2026/07/arquivo.png');
      expect(result).toEqual({ ok: true, message: 'file-deleted' });
    });

    it('deve barrar remocao para usuario comum', async () => {
      await expect(
        controller.remove({ key: 'misc/2026/07/arquivo.png' }, makeReq(userJwt)),
      ).rejects.toMatchObject({ httpStatus: 403 });
      expect(service.remove).not.toHaveBeenCalled();
    });
  });
});
