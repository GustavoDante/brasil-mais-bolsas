import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateExternalClientDto } from './dto/external-client.dto';

@Injectable()
export class ExternalClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExternalClientDto) {
    return this.prisma.externalClient.create({
      data: {
        id: dto.id,
        name: dto.name,
        externalReference: dto.id,
        personType: 'FISICA',
        cpfCnpj: dto.id,
        birthDate: new Date(),
        phone: '',
      },
    });
  }

  async findAll() {
    return this.prisma.externalClient.findMany({ where: {} });
  }

  async findOne(id: string) {
    const client = await this.prisma.externalClient.findUnique({ where: { id } });
    if (!client) throw new BadRequestException('external-client-not-found');
    return client;
  }
}
