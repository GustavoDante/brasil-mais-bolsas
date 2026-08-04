import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateAddressDto } from './dto/address.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAddressDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new AppException('invalid-user');
    return this.prisma.address.create({ data: dto });
  }

  async findAll() {
    return this.prisma.address.findMany({ where: {} });
  }
}
