import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PossiblePartnersService } from './possible-partners.service';

describe('PossiblePartnersService', () => {
  let service: PossiblePartnersService;

  const mockPrisma = {
    possiblePartner: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    possiblePartnerCall: {
      updateMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PossiblePartnersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get(PossiblePartnersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve bloquear duplicidade por email ou celular', async () => {
      mockPrisma.possiblePartner.findFirst.mockResolvedValueOnce({ id: '1' });

      await expect(
        service.create({ name: 'Lead', email: 'lead@test.com', cell: '11999999999' }),
      ).rejects.toMatchObject({ httpStatus: 400 });
    });

    it('deve criar lead quando não houver duplicidade', async () => {
      mockPrisma.possiblePartner.findFirst.mockResolvedValueOnce(null);
      mockPrisma.possiblePartner.create.mockResolvedValueOnce({ id: '2' });

      const result = await service.create({
        name: 'Lead',
        email: 'lead@test.com',
        cell: '11999999999',
      });

      expect(result).toEqual({ id: '2' });
    });
  });

  describe('findOne', () => {
    it('deve lançar erro quando o lead não existir', async () => {
      mockPrisma.possiblePartner.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('missing')).rejects.toMatchObject({ httpStatus: 404 });
    });
  });

  describe('createCall', () => {
    it('deve atualizar chamadas anteriores quando to_return for false', async () => {
      mockPrisma.possiblePartner.findUnique.mockResolvedValueOnce({ id: 'pp-1', delete: false });
      mockPrisma.possiblePartnerCall.create.mockResolvedValueOnce({ id: 'call-1' });

      await service.createCall('caller-1', {
        possible_partner_id: 'pp-1',
        description: 'Contato realizado',
        to_return: false,
      });

      expect(mockPrisma.possiblePartnerCall.updateMany).toHaveBeenCalledWith({
        where: { possible_partner_id: 'pp-1' },
        data: { to_return: false },
      });
    });
  });
});
