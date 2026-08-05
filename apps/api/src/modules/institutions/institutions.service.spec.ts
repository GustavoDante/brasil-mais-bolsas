import { Test } from '@nestjs/testing';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Institution } from '@repo/db';
import { StorageService } from '../../integrations/storage/storage.service';
import { UploadsService } from '../uploads/uploads.service';
import { InstitutionsService } from './institutions.service';

const imageFile: UploadedFileData = {
  fieldname: 'image',
  originalname: 'logo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 40,
  buffer: Buffer.alloc(40),
};

const mockInstitution: Institution = {
  id: 'inst-id-1',
  name: 'FACULDADE EXAMINAR',
  description: 'Desc',
  image: 'img.png',
  cnpj: '12345678000199',
  email: 'email@faculdade.com',
  email_2: null,
  phone: '11999999999',
  phone_2: null,
  phone_3: null,
  owner_name: 'Dono',
  owner_phone: '11999999999',
  owner_secondary_phone: null,
  owner_birthdate: new Date(),
  operator_name: 'Operador',
  operator_phone: '11999999999',
  operator_birthdate: new Date(),
  operator_2_name: null,
  operator_2_phone: null,
  operator_2_birthdate: null,
  street: 'Rua',
  number: '123',
  district: 'Bairro',
  city: 'SAO PAULO',
  state: 'SP',
  postal_code: '01000-000',
  students_count: 100,
  observations: null,
  old_id: null,
  fake: false,
  active: true,
  delete: false,
  seller_id: 'seller-id-1',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('InstitutionsService', () => {
  let service: InstitutionsService;
  let prisma: {
    institution: Record<string, jest.Mock>;
    order: Record<string, jest.Mock>;
  };
  let uploads: { upload: jest.Mock; remove: jest.Mock };
  let storage: { removeByUrlSafely: jest.Mock };

  beforeEach(async () => {
    prisma = {
      institution: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      order: {
        count: jest.fn(),
      },
    };

    uploads = {
      upload: jest.fn().mockResolvedValue({
        key: 'institutions/2026/07/arquivo.png',
        url: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
        contentType: 'image/png',
        size: 40,
      }),
      remove: jest.fn(),
    };

    storage = { removeByUrlSafely: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploads },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(InstitutionsService);
  });

  describe('findAll', () => {
    it('deve retornar apenas a instituicao do manager', async () => {
      prisma.institution.findMany.mockResolvedValue([mockInstitution]);

      const result = await service.findAll('manager', 'user-id', 'inst-id-1');

      expect(prisma.institution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { delete: false, id: 'inst-id-1' } }),
      );
      expect(result).toEqual([mockInstitution]);
    });

    it('deve retornar todas para admin e somar relatorios', async () => {
      const mockAdminInst = {
        ...mockInstitution,
        scholarships: [{ quantity_offered: 10 }, { quantity_offered: 20 }],
      };
      prisma.institution.findMany.mockResolvedValue([mockAdminInst]);
      prisma.order.count.mockResolvedValue(5);

      const result = await service.findAll('admin', 'admin-id');

      expect(prisma.institution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { delete: false } }),
      );
      expect(result[0]).toHaveProperty('offered_scholarships', 30);
      expect(result[0]).toHaveProperty('scholarships_sold', 5);
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { scholarship: { institution_id: 'inst-id-1' } },
      });
    });
  });

  describe('create', () => {
    it('deve criar uma instituicao', async () => {
      prisma.institution.create.mockResolvedValue(mockInstitution);

      const result = await service.create({
        name: 'FACULDADE EXAMINAR',
        city: 'Sao Paulo',
        seller_id: 'seller-id',
      } as never);

      expect(prisma.institution.create).toHaveBeenCalled();
      // Testando uppercase no campo city
      const callArgs = prisma.institution.create.mock.calls[0][0] as { data: { city: string } };
      expect(callArgs.data.city).toBe('SAO PAULO');
      expect(result).toEqual(mockInstitution);
    });

    it('deve subir a imagem para o S3 e gravar a URL quando vier arquivo', async () => {
      prisma.institution.create.mockResolvedValue(mockInstitution);

      await service.create(
        { name: 'FACULDADE', city: 'Sao Paulo', seller_id: 'seller-id' } as never,
        imageFile,
      );

      expect(uploads.upload).toHaveBeenCalledWith(imageFile, 'institutions');
      const callArgs = prisma.institution.create.mock.calls[0][0] as { data: { image: string } };
      expect(callArgs.data.image).toBe(
        'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
      );
    });

    it('deve remover o arquivo do bucket se a gravacao falhar', async () => {
      prisma.institution.create.mockRejectedValue(new Error('cnpj duplicado'));

      await expect(
        service.create({ name: 'F', city: 'SP', seller_id: 's' } as never, imageFile),
      ).rejects.toThrow('cnpj duplicado');
      expect(storage.removeByUrlSafely).toHaveBeenCalledWith(
        'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
      );
    });

    it('deve manter a URL enviada no corpo quando nao houver arquivo', async () => {
      prisma.institution.create.mockResolvedValue(mockInstitution);

      await service.create({
        name: 'FACULDADE',
        city: 'Sao Paulo',
        seller_id: 'seller-id',
        image: 'https://cdn.exemplo.com/logo.png',
      } as never);

      expect(uploads.upload).not.toHaveBeenCalled();
      const callArgs = prisma.institution.create.mock.calls[0][0] as { data: { image: string } };
      expect(callArgs.data.image).toBe('https://cdn.exemplo.com/logo.png');
    });
  });

  describe('update', () => {
    it('deve lancar AppException 404 se a instituicao nao existir', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.update('id', {})).rejects.toMatchObject({ httpStatus: 404 });
    });

    it('deve atualizar a instituicao convertendo city para upper case', async () => {
      prisma.institution.findUnique.mockResolvedValue(mockInstitution);
      prisma.institution.update.mockResolvedValue(mockInstitution);

      await service.update('inst-id-1', { city: 'rio de janeiro' });

      expect(prisma.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ city: 'RIO DE JANEIRO' }) }),
      );
    });

    it('deve subir a nova imagem e remover a anterior do bucket', async () => {
      const anterior = {
        ...mockInstitution,
        image: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/06/antigo.png',
      };
      prisma.institution.findUnique.mockResolvedValue(anterior);
      prisma.institution.update.mockResolvedValue({
        ...anterior,
        image: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
      });

      await service.update('inst-id-1', {}, imageFile);

      expect(uploads.upload).toHaveBeenCalledWith(imageFile, 'institutions');
      expect(prisma.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/07/arquivo.png',
          }),
        }),
      );
      expect(storage.removeByUrlSafely).toHaveBeenCalledWith(anterior.image);
    });

    it('nao deve remover a URL recebida no corpo quando o update falha sem arquivo', async () => {
      prisma.institution.findUnique.mockResolvedValue(mockInstitution);
      prisma.institution.update.mockRejectedValue(new Error('falha'));

      await expect(
        service.update('inst-id-1', {
          image: 'https://bucket.s3.sa-east-1.amazonaws.com/institutions/2026/06/outro.png',
        }),
      ).rejects.toThrow('falha');
      expect(storage.removeByUrlSafely).not.toHaveBeenCalled();
    });

    it('nao deve mexer no bucket quando o update nao envia arquivo', async () => {
      prisma.institution.findUnique.mockResolvedValue(mockInstitution);
      prisma.institution.update.mockResolvedValue(mockInstitution);

      await service.update('inst-id-1', { name: 'Novo nome' });

      expect(uploads.upload).not.toHaveBeenCalled();
      expect(storage.removeByUrlSafely).not.toHaveBeenCalled();
    });
  });

  describe('softDelete e toggleActive', () => {
    it('deve setar delete=true em softDelete', async () => {
      prisma.institution.findUnique.mockResolvedValue(mockInstitution);
      prisma.institution.update.mockResolvedValue(mockInstitution);

      await service.softDelete('id');
      expect(prisma.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { delete: true, active: false } }),
      );
    });

    it('deve inverter active em toggleActive', async () => {
      prisma.institution.findUnique.mockResolvedValue(mockInstitution);
      prisma.institution.update.mockResolvedValue(mockInstitution);

      await service.toggleActive('id');
      expect(prisma.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { active: false } }), // !true do mock
      );
    });
  });
});
