import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import type { CreateCourseCategoryDto, UpdateCourseCategoryDto } from './dto/course-categories.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class CourseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseCategoryDto) {
    const data: Prisma.CourseCategoryCreateInput = {
      name: dto.name,
      old_id: dto.old_id || '',
    };
    if (dto.order !== undefined) {
      data.order = dto.order;
    }
    return this.prisma.courseCategory.create({ data });
  }

  async findAll() {
    return this.prisma.courseCategory.findMany({
      where: { delete: false },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        active: true,
        order: true,
      },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id, delete: false },
    });
    if (!category) throw new AppException('course-category-not-found');
    return category;
  }

  async findByOldId(oldId: string) {
    const category = await this.prisma.courseCategory.findFirst({
      where: { old_id: oldId, delete: false },
    });
    if (!category) throw new AppException('course-category-not-found');
    return category;
  }

  async update(id: string, dto: UpdateCourseCategoryDto) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id, delete: false },
    });
    if (!category) throw new AppException('course-category-not-found');

    const updateData: Prisma.CourseCategoryUpdateInput = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.order !== undefined) updateData.order = dto.order;

    return this.prisma.courseCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id, delete: false },
    });
    if (!category) throw new AppException('course-category-not-found');

    return this.prisma.courseCategory.update({
      where: { id },
      data: { delete: true, active: false },
    });
  }

  async toggleActive(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id, delete: false },
    });
    if (!category) throw new AppException('course-category-not-found');

    return this.prisma.courseCategory.update({
      where: { id },
      data: { active: !category.active },
    });
  }
}
