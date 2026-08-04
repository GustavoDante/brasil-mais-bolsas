import {
  GeneralReportQuerySchema,
  PaymentsReportQuerySchema,
  RenewalsReportQuerySchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class GeneralReportQueryDto extends createZodDto(GeneralReportQuerySchema) {}

export class RenewalsReportQueryDto extends createZodDto(RenewalsReportQuerySchema) {}

export class PaymentsReportQueryDto extends createZodDto(PaymentsReportQuerySchema) {}
