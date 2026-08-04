import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMinorDto } from './dto/minor.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class MinorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMinorDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new AppException('invalid-user');
    return this.prisma.minor.create({
      data: { user_id: dto.user_id, name: dto.name, birthdate: new Date(dto.birthdate) },
    });
  }

  async findAll() {
    return this.prisma.minor.findMany({ where: {} });
  }
}
