import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFaqDto) {
    return this.prisma.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
      },
    });
  }

  async findAll() {
    return this.prisma.faq.findMany({
      where: { delete: false },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const faq = await this.prisma.faq.findUnique({
      where: { id },
    });

    if (!faq || faq.delete) {
      throw new AppException('faq-not-found');
    }

    return faq;
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.findOne(id);

    return this.prisma.faq.update({
      where: { id },
      data: {
        ...(dto.question !== undefined ? { question: dto.question } : {}),
        ...(dto.answer !== undefined ? { answer: dto.answer } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.faq.update({
      where: { id },
      data: { delete: true },
    });
  }
}
