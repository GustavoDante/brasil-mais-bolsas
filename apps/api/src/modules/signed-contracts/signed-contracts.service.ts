import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSignedContractDto } from './dto/signed-contract.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class SignedContractsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSignedContractDto) {
    // validate user and scholarship exist
    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new AppException('invalid-user');
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id: dto.scholarship_id },
    });
    if (!scholarship) throw new AppException('invalid-scholarship');

    return this.prisma.signedContract.create({
      data: {
        ip: dto.ip,
        isMobile: dto.isMobile,
        user_id: dto.user_id,
        scholarship_id: dto.scholarship_id,
        deviceInfo: dto.deviceInfo,
      },
    });
  }

  async findAll() {
    return this.prisma.signedContract.findMany({
      where: {},
      include: {
        user: { select: { id: true, name: true } },
        scholarship: { select: { id: true } },
      },
    });
  }
}
