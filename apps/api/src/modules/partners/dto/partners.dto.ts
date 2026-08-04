import {
  CreatePartnerSchema,
  PartnerLoginSchema,
  PartnersQuerySchema,
  RegisterAccessSchema,
  UpdatePartnerSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreatePartnerDto extends createZodDto(CreatePartnerSchema) {}

export class UpdatePartnerDto extends createZodDto(UpdatePartnerSchema) {}

export class PartnerLoginDto extends createZodDto(PartnerLoginSchema) {}

export class PartnersQueryDto extends createZodDto(PartnersQuerySchema) {}

export class RegisterAccessDto extends createZodDto(RegisterAccessSchema) {}
