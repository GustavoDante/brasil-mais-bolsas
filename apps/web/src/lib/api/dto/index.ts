/**
 * Tipos das respostas da API, em snake_case — a forma exata que o backend serializa.
 *
 * **Nada aqui é declarado à mão.** As entidades vêm de `@repo/contracts`, gerado do
 * `schema.prisma`; este arquivo só dá a elas os nomes `*Dto` que a camada de dados já usa
 * e monta as composições que existem apenas na resposta HTTP (relacionamentos incluídos,
 * agregados, envelopes).
 *
 * Regra mantida: DTO nunca vaza para os componentes — a UI consome os modelos de
 * `src/types`, produzidos pelos mappers em `src/lib/mappers`.
 */
import type {
  Access,
  Address,
  Call,
  City,
  CourseCategorySummary,
  CourseSummary,
  ExternalClient,
  FaqResponse,
  HomeShowcaseItem,
  Indication,
  IndicationCall,
  Institution,
  InstitutionSummary,
  Minor,
  NamedEntity,
  Notification,
  Order,
  Partner,
  Payment,
  PossiblePartner,
  PossiblePartnerCall,
  Scholarship,
  ScholarshipResponse,
  Seller,
  SignedContract,
  UserIdentity,
  UserResponse,
  UserSafe,
} from "@repo/contracts";

export type { Decimalish, IsoDate } from "@repo/contracts";
export type {
  AuthProfile as AuthProfileDto,
  AuthResponse as AuthResponseDto,
  ContactRequestInput as ContactRequestDto,
  CreateIndicationInput as IndicationRequestDto,
  CreatePossiblePartnerInput as PossiblePartnerRequestDto,
  DurationType as DurationTypeDto,
  PaymentType as PaymentTypeDto,
  ScholarshipType as ScholarshipTypeDto,
} from "@repo/contracts";

// --- Entidades (geradas do schema.prisma) ------------------------------------------
export type AddressDto = Address;
export type MinorDto = Minor;
export type UserIdentityDto = UserIdentity;
export type UserDto = UserResponse;
export type UserSafeDto = UserSafe;
export type PartnerDto = Partner & {
  /** Presentes nas listagens do backoffice. */
  accesses_count?: number;
  users_count?: number;
};
export type AccessDto = Access;
export type SellerDto = Seller;
export type InstitutionDto = Institution;
export type PaymentDto = Payment;
export type SignedContractDto = SignedContract;
export type IndicationDto = Indication;
export type IndicationCallDto = IndicationCall;
export type PossiblePartnerDto = PossiblePartner;
export type PossiblePartnerCallDto = PossiblePartnerCall;
export type CallDto = Call;
export type NotificationDto = Notification;
export type ExternalClientDto = ExternalClient;
export type CourseDto = CourseSummary;
export type CourseCategoryDto = CourseCategorySummary;
export type InstitutionSummaryDto = InstitutionSummary;
export type ScholarshipDto = ScholarshipResponse;
export type CityDto = City;
export type NamedEntityDto = NamedEntity;
export type FaqDto = FaqResponse;
export type HomeShowcaseItemDto = HomeShowcaseItem;

// --- Envelopes e composições que só existem na resposta HTTP -------------------------

export interface ApiOkResponse {
  ok: boolean;
  message?: string;
}

/** Referência mínima da bolsa, como aparece dentro de pedidos e pagamentos. */
export type ScholarshipRefDto = Pick<
  Scholarship,
  | "id"
  | "shift"
  | "type"
  | "full_price"
  | "discount"
  | "final_price"
  | "course_id"
  | "institution_id"
> & {
  course?: NamedEntity | null;
  institution?: NamedEntity | null;
};

/** Pedido com os relacionamentos que a API resolve. */
export type OrderDto = Order & {
  user?: UserDto | null;
  scholarship?: ScholarshipRefDto | null;
  payments?: PaymentDto[];
};

/** Bolsa no backoffice: entidade completa mais o que a API agrega na consulta. */
export type ScholarshipFullDto = Scholarship & {
  course?: NamedEntity | null;
  institution?: (NamedEntity & { city?: string | null }) | null;
  institution_name?: string;
  payments_count?: number;
};

/** `GET /scholarships/contract/:id` */
export interface ScholarshipContractDto {
  scholarship?: ScholarshipFullDto;
  user?: UserDto;
  [key: string]: unknown;
}

/** Linhas dos relatórios — o formato varia por relatório e é montado em SQL/serviço. */
export type ReportRowDto = Record<string, unknown>;

export interface PaymentGatewayDto {
  id?: string;
  status?: string;
  value?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  [key: string]: unknown;
}

export interface PixQrCodeDto {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

export interface PaymentResultDto {
  ok: boolean;
  message?: string;
  paymentId?: string;
  payment: PaymentDto;
  gateway?: PaymentGatewayDto;
  pixQrCode?: PixQrCodeDto;
}

export interface AsaasWebhookResultDto {
  ok: boolean;
  message: string;
  event?: string;
  gatewayPaymentId?: string;
}

export interface ScheduledJobDto {
  name: string;
  cron_time: string;
  time_zone: string;
  active: boolean;
  next_run?: string | null;
  last_run?: string | null;
}

export interface OrdersRenewalItemDto {
  order_id: string;
  user_id: string;
  outcome: "renewed" | "skipped" | "failed";
  reason?: string;
  renewal_order_id?: string;
  value?: number;
}

export interface OrdersRenewalSummaryDto {
  started_at: string;
  finished_at: string;
  duration_ms: number;
  scanned: number;
  renewed: number;
  skipped: number;
  failed: number;
  items: OrdersRenewalItemDto[];
}

// --- Envelopes de listagem ------------------------------------------------------------

export interface ScholarshipListResponseDto extends ApiOkResponse {
  scholarships: ScholarshipDto[];
}

export interface ScholarshipResponseDto extends ApiOkResponse {
  scholarship?: ScholarshipDto;
}

export interface HomeShowcaseResponseDto extends ApiOkResponse {
  scholarships: HomeShowcaseItemDto[];
}

export interface CityListResponseDto extends ApiOkResponse {
  cities: CityDto[];
}

export interface InstitutionListResponseDto extends ApiOkResponse {
  institutions: NamedEntityDto[];
}

export interface CourseListResponseDto extends ApiOkResponse {
  courses: NamedEntityDto[];
}

/** A rota responde ora em `categories`, ora em `courseCategories`. */
export interface CourseCategoryListResponseDto extends ApiOkResponse {
  categories?: CourseCategoryDto[];
  courseCategories?: CourseCategoryDto[];
}

/** A rota responde ora em `faqs`, ora em `faq`. */
export interface FaqListResponseDto extends ApiOkResponse {
  faqs?: FaqDto[];
  faq?: FaqDto[];
}
