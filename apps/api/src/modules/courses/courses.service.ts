import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import type { CreateCourseDto, UpdateCourseDto } from './dto/courses.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id: dto.category_id },
    });
    if (!category || (category as unknown as { delete?: boolean }).delete)
      throw new BadRequestException('category-not-valid');

    return this.prisma.course.create({
      data: {
        name: dto.name,
        duration: dto.duration,
        duration_type: dto.duration_type,
        category_id: dto.category_id,
        old_id: dto.old_id || '',
      },
    });
  }

  async findAll(userType: string, userInstitutionId?: string | null) {
    if (userType === 'manager') {
      if (!userInstitutionId) return [];
      return this.prisma.course.findMany({
        where: {
          delete: false,
          scholarships: {
            some: {
              institution_id: userInstitutionId,
            },
          },
        },
        include: {
          category: true,
          scholarships: {
            where: { institution_id: userInstitutionId },
          },
        },
        orderBy: { id: 'asc' },
      });
    }

    return this.prisma.course.findMany({
      where: { delete: false },
      include: { category: true },
    });
  }

  async findByInstitutionName(institutionName: string) {
    const institution = await this.prisma.institution.findFirst({
      where: { name: { equals: institutionName, mode: 'insensitive' } },
    });

    if (!institution) throw new NotFoundException('institution-not-found');

    return this.prisma.course.findMany({
      where: {
        delete: false,
        scholarships: {
          some: { institution_id: institution.id },
        },
      },
      include: {
        category: true,
        scholarships: {
          where: { institution_id: institution.id },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async searchByName(term: string) {
    return this.prisma.course.findMany({
      where: {
        delete: false,
        name: { contains: term, mode: 'insensitive' },
      },
      include: { category: true },
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!course || course.delete) throw new NotFoundException('course-not-found');
    return course;
  }

  async findByOldId(oldId: string) {
    const course = await this.prisma.course.findFirst({
      where: { old_id: oldId, delete: false },
      include: { category: true },
    });
    if (!course) throw new NotFoundException('course-not-found');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.delete) throw new NotFoundException('course-not-found');

    if (dto.category_id) {
      const category = await this.prisma.courseCategory.findUnique({
        where: { id: dto.category_id },
      });
      if (!category || (category as unknown as { delete?: boolean }).delete)
        throw new BadRequestException('category-not-valid');
    }

    const updateData: Prisma.CourseUpdateInput = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.duration) updateData.duration = dto.duration;
    if (dto.duration_type) updateData.duration_type = dto.duration_type;
    if (dto.category_id) updateData.category = { connect: { id: dto.category_id } };

    return this.prisma.course.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.delete) throw new NotFoundException('course-not-found');

    return this.prisma.course.update({
      where: { id },
      data: { delete: true, active: false },
    });
  }

  async toggleActive(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.delete) throw new NotFoundException('course-not-found');

    return this.prisma.course.update({
      where: { id },
      data: { active: !course.active },
    });
  }
}
