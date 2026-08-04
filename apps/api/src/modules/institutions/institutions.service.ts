import { Injectable, NotFoundException } from '@nestjs/common';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import { StorageService } from '../../integrations/storage/storage.service';
import { UploadsService } from '../uploads/uploads.service';
import type { CreateInstitutionDto, UpdateInstitutionDto } from './dto/institutions.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(userType: string, userId: string, userInstitutionId?: string | null) {
    const query: Prisma.InstitutionWhereInput = { delete: false };

    if (userType === 'manager') {
      if (!userInstitutionId) return [];
      query.id = userInstitutionId;
    }

    const institutions = await this.prisma.institution.findMany({
      where: query,
      include: {
        seller: {
          select: { id: true, name: true, email: true },
        },
        scholarships: {
          where: { delete: false },
          select: { id: true, quantity_offered: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (userType === 'admin') {
      return Promise.all(
        institutions.map(async (inst) => {
          const offered_scholarships = inst.scholarships.reduce(
            (acc, curr) => acc + curr.quantity_offered,
            0,
          );

          const scholarships_sold = await this.prisma.order.count({
            where: {
              scholarship: { institution_id: inst.id },
            },
          });

          return {
            ...inst,
            offered_scholarships,
            scholarships_sold,
          };
        }),
      );
    }

    return institutions;
  }

  async searchByName(term: string) {
    return this.prisma.institution.findMany({
      where: {
        delete: false,
        name: { contains: term, mode: 'insensitive' },
      },
      include: {
        scholarships: {
          where: { delete: false },
        },
      },
    });
  }

  async searchByCity(term: string) {
    const result = await this.prisma.institution.findMany({
      where: {
        delete: false,
        active: true,
        name: { contains: term, mode: 'insensitive' },
        scholarships: {
          some: {
            delete: false,
            expired: false,
            active: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      distinct: ['id'],
    });
    return result;
  }

  async findById(id: string) {
    return this.prisma.institution
      .findUnique({
        where: { id },
        include: {
          seller: { select: { id: true, name: true, email: true } },
        },
      })
      .then((i) => (i && !i.delete ? i : null));
  }

  async findByOldId(oldId: string) {
    return this.prisma.institution.findFirst({
      where: { old_id: oldId, delete: false },
    });
  }

  /**
   * `image` pode chegar de duas formas (mesma rota, como no projeto antigo):
   * - `multipart/form-data` com o arquivo no campo `image` → sobe para o S3 e grava a URL;
   * - JSON com o campo `image` ja preenchido (URL de um upload anterior).
   */
  async create(dto: CreateInstitutionDto, image?: UploadedFileData) {
    const uploaded = image ? await this.uploadsService.upload(image, 'institutions') : null;

    try {
      return await this.createRecord(dto, uploaded?.url);
    } catch (error) {
      // Compensacao: sem o registro, o arquivo no bucket ficaria orfao
      if (uploaded) await this.storageService.removeByUrlSafely(uploaded.url);
      throw error;
    }
  }

  private createRecord(dto: CreateInstitutionDto, imageUrl?: string) {
    return this.prisma.institution.create({
      data: {
        name: dto.name,
        description: dto.description,
        cnpj: dto.cnpj,
        phone: dto.phone,
        owner_name: dto.owner_name,
        operator_name: dto.operator_name,
        street: dto.street,
        number: dto.number,
        district: dto.district,
        city: dto.city.toUpperCase(),
        state: dto.state,
        postal_code: dto.postal_code,
        students_count: dto.students_count,
        seller_id: dto.seller_id,
        image: imageUrl ?? dto.image ?? '',
        email: dto.email,
        email_2: dto.email_2,
        phone_2: dto.phone_2,
        phone_3: dto.phone_3,
        owner_phone: dto.owner_phone,
        owner_secondary_phone: dto.owner_secondary_phone,
        owner_birthdate: dto.owner_birthdate ? new Date(dto.owner_birthdate) : null,
        operator_phone: dto.operator_phone,
        operator_birthdate: dto.operator_birthdate ? new Date(dto.operator_birthdate) : null,
        operator_2_name: dto.operator_2_name,
        operator_2_phone: dto.operator_2_phone,
        operator_2_birthdate: dto.operator_2_birthdate ? new Date(dto.operator_2_birthdate) : null,
        observations: dto.observations,
        old_id: dto.old_id,
        fake: dto.fake ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateInstitutionDto, image?: UploadedFileData) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });

    if (!institution || institution.delete) {
      throw new NotFoundException('Institution not found');
    }

    const updateData: Prisma.InstitutionUpdateInput = { ...dto };

    let uploadedUrl: string | undefined;

    if (image) {
      const uploaded = await this.uploadsService.upload(image, 'institutions');
      uploadedUrl = uploaded.url;
      updateData.image = uploadedUrl;
    }

    if (dto.city) updateData.city = dto.city.toUpperCase();
    if (dto.owner_birthdate) updateData.owner_birthdate = new Date(dto.owner_birthdate);
    if (dto.operator_birthdate) updateData.operator_birthdate = new Date(dto.operator_birthdate);
    if (dto.operator_2_birthdate) {
      updateData.operator_2_birthdate = new Date(dto.operator_2_birthdate);
    }

    let updated;

    try {
      updated = await this.prisma.institution.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      // Compensacao: so remove o arquivo que este request subiu — nunca uma URL recebida
      // no corpo, que pode apontar para a imagem de outro registro
      if (uploadedUrl) await this.storageService.removeByUrlSafely(uploadedUrl);
      throw error;
    }

    // Imagem trocada: apaga a anterior do bucket (best-effort, nunca derruba o update)
    if (image && institution.image && institution.image !== updated.image) {
      await this.storageService.removeByUrlSafely(institution.image);
    }

    return updated;
  }

  async softDelete(id: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });

    if (!institution || institution.delete) {
      throw new NotFoundException('Institution not found');
    }

    return this.prisma.institution.update({
      where: { id },
      data: { delete: true, active: false },
    });
  }

  async toggleActive(id: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });

    if (!institution || institution.delete) {
      throw new NotFoundException('Institution not found');
    }

    return this.prisma.institution.update({
      where: { id },
      data: { active: !institution.active },
    });
  }
}
