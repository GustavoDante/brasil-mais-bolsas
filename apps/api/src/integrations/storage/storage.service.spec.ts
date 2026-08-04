import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn();

  return {
    __send: send,
    S3Client: jest.fn().mockImplementation(() => ({ send, destroy: jest.fn() })),
    PutObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
    DeleteObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  };
});

interface S3ClientMockModule {
  __send: jest.Mock<Promise<unknown>, unknown[]>;
  PutObjectCommand: jest.Mock<unknown, [Record<string, unknown>]>;
  DeleteObjectCommand: jest.Mock<unknown, [Record<string, unknown>]>;
}

const s3Mock = jest.requireMock<S3ClientMockModule>('@aws-sdk/client-s3');

const putObjectInput = (): Record<string, unknown> => s3Mock.PutObjectCommand.mock.calls[0][0];

describe('StorageService', () => {
  let service: StorageService;
  let env: Record<string, string | undefined>;

  const build = async (overrides: Record<string, string | undefined> = {}) => {
    env = { AWS_S3_BUCKET: 'bucket-teste', AWS_REGION: 'sa-east-1', ...overrides };

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => env[key]) },
        },
      ],
    }).compile();

    service = module.get(StorageService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await build();
  });

  describe('upload', () => {
    it('deve enviar o arquivo com key gerada, content-type detectado e criptografia', async () => {
      s3Mock.__send.mockResolvedValue({});

      const result = await service.upload({
        buffer: Buffer.from('conteudo'),
        contentType: 'image/png',
        extension: '.png',
        folder: 'institutions',
        originalName: '../../logo da faculdade.png',
      });

      const input = putObjectInput();

      expect(input.Bucket).toBe('bucket-teste');
      expect(input.ContentType).toBe('image/png');
      expect(input.ServerSideEncryption).toBe('AES256');
      expect(input.ACL).toBeUndefined();
      expect(input.Metadata).toEqual({ 'original-name': 'logo-da-faculdade.png' });
      expect(result.key).toMatch(/^institutions\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
      expect(result.url).toBe(`https://bucket-teste.s3.sa-east-1.amazonaws.com/${result.key}`);
      expect(result.size).toBe(Buffer.from('conteudo').length);
    });

    it('deve marcar PDF como attachment para nao renderizar no dominio do bucket', async () => {
      s3Mock.__send.mockResolvedValue({});

      await service.upload({
        buffer: Buffer.from('%PDF-1.7'),
        contentType: 'application/pdf',
        extension: '.pdf',
        folder: 'contracts',
        originalName: 'contrato.pdf',
      });

      expect(putObjectInput().ContentDisposition).toBe('attachment; filename="contrato.pdf"');
    });

    it('deve usar a URL publica configurada (CDN) quando existir', async () => {
      await build({ AWS_S3_PUBLIC_URL: 'https://cdn.brasilmaisbolsas.com.br/' });
      s3Mock.__send.mockResolvedValue({});

      const result = await service.upload({
        buffer: Buffer.from('x'),
        contentType: 'image/png',
        extension: '.png',
        folder: 'misc',
      });

      expect(result.url).toBe(`https://cdn.brasilmaisbolsas.com.br/${result.key}`);
    });

    it('deve lancar 503 quando o bucket nao estiver configurado', async () => {
      await build({ AWS_S3_BUCKET: undefined });

      await expect(
        service.upload({
          buffer: Buffer.from('x'),
          contentType: 'image/png',
          extension: '.png',
          folder: 'misc',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(s3Mock.__send).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve enviar DeleteObjectCommand com bucket e key', async () => {
      s3Mock.__send.mockResolvedValue({});

      await service.remove('institutions/2026/07/arquivo.png');

      expect(s3Mock.DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'bucket-teste',
        Key: 'institutions/2026/07/arquivo.png',
      });
    });
  });

  describe('extractKey e removeByUrlSafely', () => {
    it('deve extrair a key de uma URL do bucket', () => {
      expect(
        service.extractKey('https://bucket-teste.s3.sa-east-1.amazonaws.com/misc/2026/07/a.png'),
      ).toBe('misc/2026/07/a.png');
    });

    it('deve ignorar URL de outro dominio (imagem legada)', () => {
      expect(service.extractKey('https://outrosite.com/logo.png')).toBeNull();
    });

    it('deve ignorar valores vazios', () => {
      expect(service.extractKey(null)).toBeNull();
      expect(service.extractKey(undefined)).toBeNull();
    });

    it('nao deve chamar o S3 quando a URL nao pertence ao bucket', async () => {
      await service.removeByUrlSafely('https://outrosite.com/logo.png');

      expect(s3Mock.__send).not.toHaveBeenCalled();
    });

    it('nao deve propagar erro do S3 ao remover a imagem antiga', async () => {
      s3Mock.__send.mockRejectedValue(new Error('AccessDenied'));

      await expect(
        service.removeByUrlSafely(
          'https://bucket-teste.s3.sa-east-1.amazonaws.com/misc/2026/07/a.png',
        ),
      ).resolves.toBeUndefined();
    });
  });
});
