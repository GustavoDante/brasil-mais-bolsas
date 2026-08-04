import { z } from 'zod';

import {
  AccessSchema,
  AddressSchema,
  CallSchema,
  CourseCategorySchema,
  CourseSchema,
  ExternalClientSchema,
  FaqSchema,
  IndicationCallSchema,
  IndicationSchema,
  InstitutionSchema,
  MinorSchema,
  NotificationSchema,
  OrderSchema,
  PartnerSchema,
  PaymentSchema,
  PossiblePartnerCallSchema,
  PossiblePartnerSchema,
  ScholarshipSchema,
  SellerSchema,
  SignedContractSchema,
  UserIdentitySchema,
  UserSchema,
} from './generated/schemas/models';

/**
 * Entidades do banco, no formato **wire** — a forma exata em que trafegam no JSON da API.
 *
 * Duas conversões do Prisma já estão embutidas nos schemas gerados:
 * - `Decimal` é `string` (ex.: `"1000.50"`), com regex de precisão vinda do `@db.Decimal`;
 * - `DateTime` é `string` ISO 8601.
 *
 * Estes schemas descrevem a **forma** (campos, nullability, defaults) e nada mais. As
 * regras de negócio de cada rota vivem nos schemas de request de cada módulo, compostos
 * a partir daqui com `.pick()` / `.omit()` / `.extend()`.
 *
 * Regenerado por `pnpm db:generate` — não edite `src/generated`.
 */

export {
  AccessSchema,
  AddressSchema,
  CallSchema,
  CourseCategorySchema,
  CourseSchema,
  ExternalClientSchema,
  FaqSchema,
  IndicationCallSchema,
  IndicationSchema,
  InstitutionSchema,
  MinorSchema,
  NotificationSchema,
  OrderSchema,
  PartnerSchema,
  PaymentSchema,
  PossiblePartnerCallSchema,
  PossiblePartnerSchema,
  ScholarshipSchema,
  SellerSchema,
  SignedContractSchema,
  UserIdentitySchema,
  UserSchema,
};

export type Access = z.infer<typeof AccessSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Call = z.infer<typeof CallSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CourseCategory = z.infer<typeof CourseCategorySchema>;
export type ExternalClient = z.infer<typeof ExternalClientSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type Indication = z.infer<typeof IndicationSchema>;
export type IndicationCall = z.infer<typeof IndicationCallSchema>;
export type Institution = z.infer<typeof InstitutionSchema>;
export type Minor = z.infer<typeof MinorSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Partner = z.infer<typeof PartnerSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type PossiblePartner = z.infer<typeof PossiblePartnerSchema>;
export type PossiblePartnerCall = z.infer<typeof PossiblePartnerCallSchema>;
export type Scholarship = z.infer<typeof ScholarshipSchema>;
export type Seller = z.infer<typeof SellerSchema>;
export type SignedContract = z.infer<typeof SignedContractSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserIdentity = z.infer<typeof UserIdentitySchema>;
