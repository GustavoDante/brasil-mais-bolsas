import {
  CreateSellerSchema,
  SellerLoginSchema,
  SellersQuerySchema,
  UpdateSellerSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateSellerDto extends createZodDto(CreateSellerSchema) {}

export class UpdateSellerDto extends createZodDto(UpdateSellerSchema) {}

export class SellerLoginDto extends createZodDto(SellerLoginSchema) {}

export class SellersQueryDto extends createZodDto(SellersQuerySchema) {}
