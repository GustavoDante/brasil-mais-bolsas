import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserIdentityDto } from './dto/user-identity.dto';

@Injectable()
export class UserIdentitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserIdentityDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new BadRequestException('user-not-found');
    return this.prisma.userIdentity.create({
      data: {
        user_id: dto.user_id,
        provider: dto.provider,
        provider_account_id: dto.provider_account_id,
      },
    });
  }

  async findAll() {
    return this.prisma.userIdentity.findMany({ where: {} });
  }
}
