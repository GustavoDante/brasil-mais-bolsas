import type { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { DurationType, ScholarshipType } from '@repo/db';
import { AuthService } from '../../src/modules/auth/auth.service';
import { CallsService } from '../../src/modules/calls/calls.service';
import { CourseCategoriesService } from '../../src/modules/course-categories/course-categories.service';
import { CoursesService } from '../../src/modules/courses/courses.service';
import { FaqService } from '../../src/modules/faq/faq.service';
import { IndicationsService } from '../../src/modules/indications/indications.service';
import { InstitutionsService } from '../../src/modules/institutions/institutions.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { ContactService } from '../../src/modules/contact/contact.service';
import { PartnersService } from '../../src/modules/partners/partners.service';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { PossiblePartnersService } from '../../src/modules/possible-partners/possible-partners.service';
import { ReportsService } from '../../src/modules/reports/reports.service';
import { ScholarshipsService } from '../../src/modules/scholarships/scholarships.service';
import { SellersService } from '../../src/modules/sellers/sellers.service';
import { UploadsService } from '../../src/modules/uploads/uploads.service';
import { UsersService } from '../../src/modules/users/users.service';
import { AppException } from '../../src/common/exceptions/app.exception';

export type GenericObject = Record<string, unknown>;

type ReportUser = {
  userId: string;
  type: string;
  institution_id?: string;
};

// ============ MOCKS ============
export const contactServiceMock = {
  submit: jest.fn(),
};

export const validContactPayload = {
  name: 'Joao da Silva',
  email: 'joao@email.com',
  phone: '11999999999',
  subject: 'Duvida sobre bolsa',
  message: 'Gostaria de saber mais sobre as bolsas disponiveis.',
};

export const paymentsServiceMock = {
  createCreditCardPayment: jest.fn<Promise<GenericObject>, [string | number, GenericObject]>(),
  createInterestPayment: jest.fn<Promise<GenericObject>, [string | number, GenericObject]>(),
  createPixPayment: jest.fn<Promise<GenericObject>, [string | number, GenericObject]>(),
  handleAsaasWebhook: jest.fn<Promise<GenericObject>, [string | undefined, GenericObject]>(),
};

export const ordersServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, [GenericObject, GenericObject]>(),
  findById: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  findExpired: jest.fn<Promise<GenericObject[]>, [GenericObject]>(),
  findVoucher: jest.fn<Promise<GenericObject | null>, [GenericObject, string]>(),
  findPayments: jest.fn<Promise<GenericObject[]>, [GenericObject, string]>(),
  updateDefaulter: jest.fn<Promise<GenericObject>, [GenericObject, GenericObject]>(),
  changeScholarship: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  getOrCreateOpenOrder: jest.fn<Promise<GenericObject>, [string, string, boolean]>(),
};

export const uploadsServiceMock = {
  upload: jest.fn<Promise<GenericObject>, [GenericObject, string | undefined]>(),
  remove: jest.fn<Promise<void>, [string]>(),
};

export const sellersServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, [GenericObject]>(),
  login: jest.fn<Promise<GenericObject>, [GenericObject, GenericObject]>(),
  findOne: jest.fn<Promise<GenericObject>, [string]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  remove: jest.fn<Promise<GenericObject>, [string]>(),
  toggleActive: jest.fn<Promise<GenericObject>, [string]>(),
};

export const partnersServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, [GenericObject]>(),
  login: jest.fn<Promise<GenericObject>, [GenericObject, GenericObject]>(),
  findOne: jest.fn<Promise<GenericObject>, [string]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  remove: jest.fn<Promise<GenericObject>, [string]>(),
  toggleActive: jest.fn<Promise<GenericObject>, [string]>(),
  registerAccess: jest.fn<Promise<void>, [GenericObject]>(),
};

export const callsServiceMock = {
  create: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findByUser: jest.fn<Promise<GenericObject[]>, [string]>(),
  findOne: jest.fn<Promise<GenericObject>, [string]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  remove: jest.fn<Promise<GenericObject>, [string]>(),
};

export const faqServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findOne: jest.fn<Promise<GenericObject>, [string]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  remove: jest.fn<Promise<GenericObject>, [string]>(),
};

export const notificationsServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, [string | undefined, boolean]>(),
  findOne: jest.fn<Promise<GenericObject>, [string]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  markAsRead: jest.fn<Promise<GenericObject>, [string, string, boolean]>(),
  remove: jest.fn<Promise<GenericObject>, [string, string, boolean]>(),
};

export const indicationsServiceMock = {
  create: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findByUser: jest.fn<Promise<GenericObject[]>, [string]>(),
  createCall: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  removeCall: jest.fn<Promise<GenericObject>, [string]>(),
};

export const possiblePartnersServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findOne: jest.fn<Promise<GenericObject>, [string]>(),
  createCall: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  removeCall: jest.fn<Promise<GenericObject>, [string]>(),
};

export const reportsServiceMock = {
  getStudents: jest.fn<Promise<GenericObject[]>, [ReportUser]>(),
  getCalled: jest.fn<Promise<GenericObject[]>, [ReportUser]>(),
  getToCall: jest.fn<Promise<GenericObject[]>, [ReportUser]>(),
  getRenewals: jest.fn<Promise<GenericObject[]>, [ReportUser, { days?: number } | undefined]>(),
  getDefaulters: jest.fn<Promise<GenericObject[]>, [ReportUser]>(),
  getGeneralReport: jest.fn<Promise<GenericObject[]>, [GenericObject, string | undefined]>(),
  getPayments: jest.fn<Promise<GenericObject[]>, [ReportUser, string]>(),
  getImpactReport: jest.fn<Promise<GenericObject[]>, [string]>(),
};

export const authServiceMock = {
  validateUser: jest.fn<Promise<GenericObject | null>, [string, string]>(),
  login: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  register: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  forgotPassword: jest.fn<Promise<void>, [string]>(),
  resetPassword: jest.fn<Promise<void>, [string, string, string]>(),
};

/** Payload mínimo aceito por POST /v1/auth/register */
export const validRegisterPayload = {
  name: 'Joao da Silva',
  email: 'joao.novo@test.com',
  phone: '11999999999',
  birthdate: '1990-01-01',
  cpf: '12345678901',
  rg: '1234567',
  rg_emissor: 'SSP-SP',
  address: {
    street: 'Rua das Flores',
    city: 'Sao Paulo',
    state: 'SP',
    number: '100',
    district: 'Centro',
    postal_code: '01000-000',
  },
};

export const usersServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findByIdWithAddress: jest.fn<Promise<GenericObject | null>, [string]>(),
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  toggleActive: jest.fn<Promise<GenericObject>, [string]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
};

export const coursesServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, [string, string | undefined]>(),
  findByInstitutionName: jest.fn<Promise<GenericObject[]>, [string]>(),
  searchByName: jest.fn<Promise<GenericObject[]>, [string]>(),
  findById: jest.fn<Promise<GenericObject | null>, [string]>(),
  findByOldId: jest.fn<Promise<GenericObject | null>, [string]>(),
  create: jest.fn<Promise<void>, [GenericObject]>(),
  update: jest.fn<Promise<void>, [string, GenericObject]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
  toggleActive: jest.fn<Promise<void>, [string]>(),
};

export const courseCategoriesServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findById: jest.fn<Promise<GenericObject | null>, [string]>(),
  findByOldId: jest.fn<Promise<GenericObject | null>, [string]>(),
  create: jest.fn<Promise<void>, [GenericObject]>(),
  update: jest.fn<Promise<void>, [string, GenericObject]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
  toggleActive: jest.fn<Promise<void>, [string]>(),
};

export const institutionsServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, [string, string, string | undefined]>(),
  searchByName: jest.fn<Promise<GenericObject[]>, [string]>(),
  searchByCity: jest.fn<Promise<GenericObject[]>, [string]>(),
  findById: jest.fn<Promise<GenericObject | null>, [string]>(),
  findByOldId: jest.fn<Promise<GenericObject | null>, [string]>(),
  // O terceiro/segundo argumento e o arquivo da logo quando a rota recebe multipart
  create: jest.fn<Promise<void>, [GenericObject, GenericObject | undefined]>(),
  update: jest.fn<Promise<void>, [string, GenericObject, GenericObject | undefined]>(),
  toggleActive: jest.fn<Promise<void>, [string]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
};

export const scholarshipsServiceMock = {
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findAllForManager: jest.fn<Promise<GenericObject[]>, [string | undefined]>(),
  listRandom: jest.fn<Promise<GenericObject[]>, [GenericObject]>(),
  listOrder: jest.fn<Promise<GenericObject[]>, [GenericObject]>(),
  searchCity: jest.fn<Promise<GenericObject[]>, [string]>(),
  listCity: jest.fn<Promise<GenericObject[]>, []>(),
  searchInstitution: jest.fn<Promise<GenericObject[]>, [string]>(),
  listInstitutionByCity: jest.fn<Promise<GenericObject[]>, [string, string]>(),
  listCourseByCity: jest.fn<Promise<GenericObject[]>, [string, string]>(),
  searchCourse: jest.fn<Promise<GenericObject[]>, [string]>(),
  getIndexList: jest.fn<Promise<GenericObject[]>, []>(),
  listBackoffice: jest.fn<Promise<GenericObject[]>, [GenericObject, GenericObject]>(),
  getContractInfo: jest.fn<Promise<GenericObject>, [string, string]>(),
  findById: jest.fn<Promise<GenericObject | null>, [string]>(),
  getStudentsCount: jest.fn<Promise<number>, [string]>(),
  changeOrderScholarship: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  findByOldId: jest.fn<Promise<GenericObject | null>, [string]>(),
  update: jest.fn<Promise<void>, [string, GenericObject]>(),
  listAll: jest.fn<Promise<GenericObject[]>, [GenericObject]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
  toggleActive: jest.fn<Promise<void>, [string]>(),
};

// ============ TEST DATA ============
export const validUser = {
  id: 'user-1',
  name: 'Usuario Teste',
  email: 'user@test.com',
  type: 'user',
  active: true,
  password: 'hash',
  reset_password_token: null,
  reset_password_expires: null,
};

export const adminUser = {
  ...validUser,
  id: 'admin-1',
  email: 'admin@test.com',
  type: 'admin',
};

export const managerUser = {
  ...validUser,
  id: 'manager-1',
  email: 'manager@test.com',
  type: 'manager',
  institution_id: 'institution-1',
};

export const validCreateUserPayload = {
  name: 'Novo Usuario',
  email: 'novo@email.com',
  phone: '11999999999',
  birthdate: '1990-01-01',
  cpf: '12345678901',
  rg: '1234567',
  rg_emissor: 'SSP-SP',
};

export const validCreateUserWithAddressPayload = {
  name: 'Novo Usuario',
  email: 'novo@email.com',
  phone: '11999999999',
  birthdate: '1990-01-01',
  cpf: '12345678901',
  rg: '1234567',
  rg_emissor: 'SSP-SP',
  address: {
    street: 'Rua das Flores',
    city: 'Sao Paulo',
    state: 'SP',
    number: '100',
    district: 'Centro',
    postal_code: '01310-100',
  },
};

export const validChangeScholarshipPayload = {
  order_id: 'order-1',
  new_scholarship: 'scholarship-2',
};

export const validNewScholarshipValuePayload = {
  shift: 'Noite',
  type: 'PRESENCIAL',
  full_price: 1200,
  discount: 60,
  quantity_offered: 5,
  renovation_days: 30,
  register_period_start: '2026-01-01T00:00:00.000Z',
  course_description: 'Nova descricao do curso',
  course_id: 'course-1',
  institution_id: 'institution-1',
  scholarship_id: 'scholarship-1',
};

export const validCreateCoursePayload = {
  name: 'Administracao',
  duration: 8,
  duration_type: DurationType.MONTHS,
  category_id: 'category-1',
};

export const validCreateCategoryPayload = {
  name: 'Graduacao',
  order: 1,
};

export const validCreateInstitutionPayload = {
  name: 'Faculdade Exemplo',
  description: 'Descricao',
  cnpj: '12345678000199',
  phone: '11999999999',
  owner_name: 'Diretor',
  operator_name: 'Operador',
  street: 'Rua A',
  number: '100',
  district: 'Centro',
  city: 'Sao Paulo',
  state: 'SP',
  postal_code: '01000-000',
  students_count: 200,
  seller_id: 'seller-1',
};

export const validCreateScholarshipPayload = {
  shift: 'Manha',
  type: ScholarshipType.PRESENCIAL,
  full_price: 1000,
  discount: 50,
  quantity_offered: 10,
  renovation_days: 30,
  register_period_start: '2026-01-01T00:00:00.000Z',
  register_period_end: '2026-12-31T23:59:59.000Z',
  course_description: 'Descricao do curso',
  course_id: 'course-1',
  institution_id: 'institution-1',
};

export const validCreditCardPaymentPayload = {
  scholarship_id: 'scholarship-1',
  installment_count: 1,
  creditCard: {
    holderName: 'USUARIO TESTE',
    number: '5162306219378829',
    expiryMonth: '05',
    expiryYear: '2028',
    ccv: '318',
  },
  creditCardHolderInfo: {
    name: 'Usuario Teste',
    email: 'user@test.com',
    cpfCnpj: '12345678901',
    postalCode: '01000-000',
    addressNumber: '100',
    mobilePhone: '11999999999',
  },
  remoteIp: '203.0.113.10',
};

export const validCreateSellerPayload = {
  name: 'João Vendedor',
  email: 'joao@vendedor.com',
  password: 'password123',
};

export const validCreatePartnerPayload = {
  name: 'Parceiro Master',
  code: 'PARCEIRO_MASTER',
  password: 'password123',
};

export const validCreateIndicationPayload = {
  name: 'Indicação Teste',
  email: 'indicacao@test.com',
  cell: '11988887777',
  city: 'São Paulo',
};

export const validCreateIndicationCallPayload = {
  indication_id: 'indication-1',
  description: 'Ligação realizada',
  to_return: false,
};

export const validCreatePossiblePartnerPayload = {
  institutionName: 'Faculdade Exemplo',
  cnpj: '12345678000199',
  modality: 'EAD',
  name: 'Maria Silva',
  email: 'maria@exemplo.com',
  message: 'Quero conversar sobre parceria.',
  cell: '11999999999',
  city: 'São Paulo',
  numStudents: '500',
};

export const validCreateCallPayload = {
  receiver_id: 'user-1',
  description: 'Ligação agendada',
  to_return: false,
};

export const validCreateFaqPayload = {
  question: 'Como funciona o processo?',
  answer: 'O processo funciona assim...',
};

export const validCreateNotificationPayload = {
  title: 'Atualização importante',
  message: 'Sua solicitação foi processada.',
  user_id: 'user-1',
};

export const validPixPaymentPayload = {
  scholarship_id: 'scholarship-1',
};

export const validInterestPaymentPayload = {
  scholarship_id: 'scholarship-1',
};

// ============ MOCK SETUP HELPERS ============
export function setupAuthServiceMocks(): void {
  authServiceMock.validateUser.mockImplementation((email: string, password: string) => {
    if (email === 'admin@test.com' && password === '123456') {
      return Promise.resolve(adminUser);
    }
    return Promise.resolve(null);
  });

  authServiceMock.login.mockImplementation((user: GenericObject) =>
    Promise.resolve({
      accessToken: 'mocked-access-token',
      user,
    }),
  );

  authServiceMock.register.mockResolvedValue({
    accessToken: 'mocked-access-token',
    user: { id: 'user-novo', email: 'joao.novo@test.com', type: 'user' },
  });
  authServiceMock.forgotPassword.mockResolvedValue(undefined);
  authServiceMock.resetPassword.mockResolvedValue(undefined);
}

export function setupUsersServiceMocks(): void {
  usersServiceMock.findAll.mockResolvedValue([adminUser, validUser]);
  usersServiceMock.findByIdWithAddress.mockResolvedValue(validUser);
  usersServiceMock.create.mockResolvedValue({ ...validUser, ...validCreateUserPayload });
  usersServiceMock.update.mockResolvedValue({ ...validUser, name: 'Nome Atualizado' });
  usersServiceMock.toggleActive.mockResolvedValue({ ...validUser, active: false });
  usersServiceMock.softDelete.mockResolvedValue();
}

export function setupCoursesServiceMocks(): void {
  coursesServiceMock.findAll.mockResolvedValue([{ id: 'course-1', name: 'Administracao' }]);
  coursesServiceMock.findByInstitutionName.mockResolvedValue([
    { id: 'course-1', name: 'Administracao' },
  ]);
  coursesServiceMock.searchByName.mockResolvedValue([{ id: 'course-2', name: 'Direito' }]);
  coursesServiceMock.findById.mockResolvedValue({ id: 'course-1', name: 'Administracao' });
  coursesServiceMock.findByOldId.mockResolvedValue({ id: 'course-legacy-1' });
  coursesServiceMock.create.mockResolvedValue();
  coursesServiceMock.update.mockResolvedValue();
  coursesServiceMock.softDelete.mockResolvedValue();
  coursesServiceMock.toggleActive.mockResolvedValue();
}

export function setupCourseCategoriesServiceMocks(): void {
  courseCategoriesServiceMock.findAll.mockResolvedValue([{ id: 'category-1', name: 'Graduacao' }]);
  courseCategoriesServiceMock.findById.mockResolvedValue({ id: 'category-1', name: 'Graduacao' });
  courseCategoriesServiceMock.findByOldId.mockResolvedValue({ id: 'legacy-category-1' });
  courseCategoriesServiceMock.create.mockResolvedValue();
  courseCategoriesServiceMock.update.mockResolvedValue();
  courseCategoriesServiceMock.softDelete.mockResolvedValue();
  courseCategoriesServiceMock.toggleActive.mockResolvedValue();
}

export function setupInstitutionsServiceMocks(): void {
  institutionsServiceMock.findAll.mockResolvedValue([
    { id: 'institution-1', name: 'Faculdade Exemplo' },
  ]);
  institutionsServiceMock.searchByName.mockResolvedValue([
    { id: 'institution-1', name: 'Faculdade Exemplo' },
  ]);
  institutionsServiceMock.searchByCity.mockResolvedValue([
    { id: 'institution-1', name: 'Sao Paulo' },
  ]);
  institutionsServiceMock.findById.mockResolvedValue({
    id: 'institution-1',
    name: 'Faculdade Exemplo',
  });
  institutionsServiceMock.findByOldId.mockResolvedValue({ id: 'legacy-institution-1' });
  institutionsServiceMock.create.mockResolvedValue();
  institutionsServiceMock.update.mockResolvedValue();
  institutionsServiceMock.toggleActive.mockResolvedValue();
  institutionsServiceMock.softDelete.mockResolvedValue();
}

export function setupScholarshipsServiceMocks(): void {
  scholarshipsServiceMock.create.mockResolvedValue({ id: 'scholarship-1' });
  scholarshipsServiceMock.findAllForManager.mockResolvedValue([{ id: 'scholarship-1' }]);
  scholarshipsServiceMock.listRandom.mockResolvedValue([{ id: 'scholarship-1' }]);
  scholarshipsServiceMock.listOrder.mockResolvedValue([{ id: 'scholarship-1' }]);
  scholarshipsServiceMock.searchCity.mockResolvedValue([{ city: 'Sao Paulo' }]);
  scholarshipsServiceMock.listCity.mockResolvedValue([{ city: 'Sao Paulo' }]);
  scholarshipsServiceMock.searchInstitution.mockResolvedValue([{ name: 'Faculdade Exemplo' }]);
  scholarshipsServiceMock.listInstitutionByCity.mockResolvedValue([{ id: 'institution-1' }]);
  scholarshipsServiceMock.listCourseByCity.mockResolvedValue([{ id: 'course-1' }]);
  scholarshipsServiceMock.searchCourse.mockResolvedValue([{ id: 'course-1' }]);
  scholarshipsServiceMock.getIndexList.mockResolvedValue([{ id: 'scholarship-1' }]);
  scholarshipsServiceMock.listBackoffice.mockResolvedValue([{ id: 'scholarship-1' }]);
  scholarshipsServiceMock.getContractInfo.mockResolvedValue({
    scholarship: { id: 'scholarship-1' },
  });
  scholarshipsServiceMock.findById.mockResolvedValue({ id: 'scholarship-1' });
  scholarshipsServiceMock.getStudentsCount.mockResolvedValue(10);
  scholarshipsServiceMock.changeOrderScholarship.mockResolvedValue({ id: 'order-1' });
  scholarshipsServiceMock.findByOldId.mockResolvedValue({ id: 'legacy-scholarship-1' });
  scholarshipsServiceMock.update.mockResolvedValue();
  scholarshipsServiceMock.listAll.mockResolvedValue([{ id: 'scholarship-1' }]);
  scholarshipsServiceMock.softDelete.mockResolvedValue();
  scholarshipsServiceMock.toggleActive.mockResolvedValue();
}

export function setupPaymentsServiceMocks(): void {
  paymentsServiceMock.createCreditCardPayment.mockResolvedValue({
    ok: true,
    message: 'payment-created',
    status: 'CONFIRMED',
  });
  paymentsServiceMock.createInterestPayment.mockResolvedValue({
    ok: true,
    message: 'interest-payment-created-successfully',
    paymentId: 'payment-1',
  });
  paymentsServiceMock.createPixPayment.mockResolvedValue({
    ok: true,
    message: 'pix-payment-created',
  });
  paymentsServiceMock.handleAsaasWebhook.mockImplementation((accessToken) => {
    if (accessToken !== 'webhook-token') {
      return Promise.reject(new AppException('invalid-asaas-webhook-token'));
    }

    return Promise.resolve({
      ok: true,
      message: 'asaas-webhook-processed',
    });
  });
}

export function setupOrdersServiceMocks(): void {
  ordersServiceMock.create.mockResolvedValue({ ok: true, message: 'order-created' });
  ordersServiceMock.findAll.mockResolvedValue([{ id: 'order-1', code: 100001 }]);
  ordersServiceMock.findById.mockResolvedValue({ id: 'order-1', code: 100001 });
  ordersServiceMock.findExpired.mockResolvedValue([{ id: 'order-renew-1', is_renew: true }]);
  ordersServiceMock.findVoucher.mockResolvedValue({ id: 'order-1', code: 100001 });
  ordersServiceMock.findPayments.mockResolvedValue([{ id: 'payment-1', status: 'PAID' }]);
  ordersServiceMock.updateDefaulter.mockResolvedValue({
    ok: true,
    message: 'Pedido marcado como inadimplente',
  });
  ordersServiceMock.changeScholarship.mockResolvedValue({ id: 'order-1' });
  ordersServiceMock.getOrCreateOpenOrder.mockResolvedValue({ id: 'order-1', code: 100001 });
}

export function setupSellersServiceMocks() {
  sellersServiceMock.create.mockResolvedValue({ id: 'seller-1' });
  sellersServiceMock.findAll.mockResolvedValue([
    { id: 'seller-1', name: 'Seller Test', active: true, students_count: 5 },
  ]);
  sellersServiceMock.login.mockResolvedValue({
    id: 'seller-1',
    name: 'Seller Test',
    active: true,
    students_count: 5,
  });
  sellersServiceMock.findOne.mockResolvedValue({ id: 'seller-1', name: 'Seller Test' });
  sellersServiceMock.update.mockResolvedValue({ id: 'seller-1' });
  sellersServiceMock.remove.mockResolvedValue({ id: 'seller-1' });
  sellersServiceMock.toggleActive.mockResolvedValue({ id: 'seller-1' });
}

export function setupPartnersServiceMocks() {
  partnersServiceMock.create.mockResolvedValue({ id: 'partner-1' });
  partnersServiceMock.findAll.mockResolvedValue([
    { id: 'partner-1', name: 'Partner Test', active: true, UsersCount: 10 },
  ]);
  partnersServiceMock.login.mockResolvedValue({
    id: 'partner-1',
    name: 'Partner Test',
    active: true,
    UsersCount: 10,
  });
  partnersServiceMock.findOne.mockResolvedValue({ id: 'partner-1', name: 'Partner Test' });
  partnersServiceMock.update.mockResolvedValue({ id: 'partner-1' });
  partnersServiceMock.remove.mockResolvedValue({ id: 'partner-1' });
  partnersServiceMock.toggleActive.mockResolvedValue({ id: 'partner-1' });
  partnersServiceMock.registerAccess.mockResolvedValue();
}

export function setupCallsServiceMocks() {
  callsServiceMock.create.mockResolvedValue({ id: 'call-1' });
  callsServiceMock.findAll.mockResolvedValue([{ id: 'call-1', description: 'Ligação' }]);
  callsServiceMock.findByUser.mockResolvedValue([{ id: 'call-1', description: 'Ligação' }]);
  callsServiceMock.findOne.mockResolvedValue({ id: 'call-1', description: 'Ligação' });
  callsServiceMock.update.mockResolvedValue({ id: 'call-1', description: 'Ligação atualizada' });
  callsServiceMock.remove.mockResolvedValue({ id: 'call-1' });
}

export function setupFaqServiceMocks() {
  faqServiceMock.create.mockResolvedValue({ id: 'faq-1' });
  faqServiceMock.findAll.mockResolvedValue([{ id: 'faq-1', question: 'Q?', answer: 'A' }]);
  faqServiceMock.findOne.mockResolvedValue({ id: 'faq-1', question: 'Q?', answer: 'A' });
  faqServiceMock.update.mockResolvedValue({ id: 'faq-1', question: 'Q2?', answer: 'A2' });
  faqServiceMock.remove.mockResolvedValue({ id: 'faq-1' });
}

export function setupNotificationsServiceMocks() {
  notificationsServiceMock.create.mockResolvedValue({ id: 'notification-1' });
  notificationsServiceMock.findAll.mockResolvedValue([
    { id: 'notification-1', title: 'Título', read: false },
  ]);
  notificationsServiceMock.findOne.mockResolvedValue({
    id: 'notification-1',
    title: 'Título',
    message: 'Mensagem',
    user_id: 'user-1',
  });
  notificationsServiceMock.update.mockResolvedValue({
    id: 'notification-1',
    title: 'Título 2',
    message: 'Mensagem 2',
  });
  notificationsServiceMock.markAsRead.mockResolvedValue({ id: 'notification-1', read: true });
  notificationsServiceMock.remove.mockResolvedValue({ id: 'notification-1' });
}

export function setupIndicationsServiceMocks() {
  indicationsServiceMock.create.mockResolvedValue({ id: 'indication-1' });
  indicationsServiceMock.findAll.mockResolvedValue([{ id: 'indication-1', name: 'Indicação 1' }]);
  indicationsServiceMock.findByUser.mockResolvedValue([
    { id: 'indication-1', name: 'Indicação 1' },
  ]);
  indicationsServiceMock.createCall.mockResolvedValue({ id: 'call-1' });
  indicationsServiceMock.removeCall.mockResolvedValue({ id: 'call-1' });
}

export function setupPossiblePartnersServiceMocks() {
  possiblePartnersServiceMock.create.mockResolvedValue({ id: 'possible-partner-1' });
  possiblePartnersServiceMock.findAll.mockResolvedValue([
    { id: 'possible-partner-1', name: 'Lead Partner' },
  ]);
  possiblePartnersServiceMock.findOne.mockResolvedValue({
    id: 'possible-partner-1',
    name: 'Lead Partner',
  });
  possiblePartnersServiceMock.createCall.mockResolvedValue({ id: 'pp-call-1' });
  possiblePartnersServiceMock.removeCall.mockResolvedValue({ id: 'pp-call-1' });
}

export function setupReportsServiceMocks() {
  reportsServiceMock.getStudents.mockResolvedValue([
    { id: 'student-1', name: 'Student 1', toCall: true },
  ]);
  reportsServiceMock.getCalled.mockResolvedValue([
    { id: 'student-2', name: 'Student 2', callsMade: [{ id: 'call-1' }] },
  ]);
  reportsServiceMock.getToCall.mockResolvedValue([
    { id: 'student-1', name: 'Student 1', toCall: true },
  ]);
  reportsServiceMock.getRenewals.mockResolvedValue([
    {
      id: 'student-3',
      name: 'Student 3',
      daysUntilRenewal: 12,
      renewalDate: '10/10/2024',
      lastPaymentDate: '10/04/2024',
    },
  ]);
  reportsServiceMock.getDefaulters.mockResolvedValue([{ id: 'student-1', name: 'Student 1' }]);
  reportsServiceMock.getGeneralReport.mockResolvedValue([{ id: 'payment-1' }]);
  reportsServiceMock.getPayments.mockResolvedValue([{ id: 'payment-2' }]);
  reportsServiceMock.getImpactReport.mockResolvedValue([{ id: 'scholarship-1' }]);
}

export function setupUploadsServiceMocks(): void {
  uploadsServiceMock.upload.mockResolvedValue({
    key: 'misc/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png',
    url: 'https://bucket.s3.sa-east-1.amazonaws.com/misc/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png',
    contentType: 'image/png',
    size: 128,
  });
  uploadsServiceMock.remove.mockResolvedValue(undefined);
}

// ============ APP INITIALIZATION ============
export async function createTestApp(): Promise<{
  app: INestApplication;
  tokens: {
    adminToken: string;
    managerToken: string;
    userToken: string;
    /** Admin com vínculo de instituição — nenhuma rota deve escopá-lo por isso. */
    adminWithInstitutionToken: string;
    /** Gestor com token anterior à claim `institution_id` (janela de migração). */
    staleManagerToken: string;
  };
}> {
  process.env.JWT_SECRET = 'e2e-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.ASAAS_WEBHOOK_TOKEN = 'webhook-token';

  setupAuthServiceMocks();
  setupUsersServiceMocks();
  setupCoursesServiceMocks();
  setupCourseCategoriesServiceMocks();
  setupInstitutionsServiceMocks();
  setupScholarshipsServiceMocks();
  setupOrdersServiceMocks();
  setupPaymentsServiceMocks();
  setupSellersServiceMocks();
  setupPartnersServiceMocks();
  setupCallsServiceMocks();
  setupFaqServiceMocks();
  setupNotificationsServiceMocks();
  setupIndicationsServiceMocks();
  setupPossiblePartnersServiceMocks();
  setupReportsServiceMocks();
  setupUploadsServiceMocks();

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue(authServiceMock)
    .overrideProvider(UsersService)
    .useValue(usersServiceMock)
    .overrideProvider(CoursesService)
    .useValue(coursesServiceMock)
    .overrideProvider(CourseCategoriesService)
    .useValue(courseCategoriesServiceMock)
    .overrideProvider(InstitutionsService)
    .useValue(institutionsServiceMock)
    .overrideProvider(ScholarshipsService)
    .useValue(scholarshipsServiceMock)
    .overrideProvider(OrdersService)
    .useValue(ordersServiceMock)
    .overrideProvider(PaymentsService)
    .useValue(paymentsServiceMock)
    .overrideProvider(SellersService)
    .useValue(sellersServiceMock)
    .overrideProvider(PartnersService)
    .useValue(partnersServiceMock)
    .overrideProvider(CallsService)
    .useValue(callsServiceMock)
    .overrideProvider(FaqService)
    .useValue(faqServiceMock)
    .overrideProvider(NotificationsService)
    .useValue(notificationsServiceMock)
    .overrideProvider(PossiblePartnersService)
    .useValue(possiblePartnersServiceMock)
    .overrideProvider(IndicationsService)
    .useValue(indicationsServiceMock)
    .overrideProvider(ReportsService)
    .useValue(reportsServiceMock)
    .overrideProvider(UploadsService)
    .useValue(uploadsServiceMock)
    .overrideProvider(ContactService)
    .useValue(contactServiceMock)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('v1');
  // Mesmo pipe do `main.ts` — os testes só valem se validarem do jeito que a produção valida.
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  const jwtService = app.get(JwtService);
  const adminToken = jwtService.sign({ sub: 'admin-1', email: 'admin@test.com', type: 'admin' });
  const managerToken = jwtService.sign({
    sub: 'manager-1',
    email: 'manager@test.com',
    type: 'manager',
    institution_id: 'institution-1',
  });
  const userToken = jwtService.sign({ sub: 'user-1', email: 'user@test.com', type: 'user' });

  // Admin que por acaso tem vínculo com uma instituição. Existe para provar que nenhuma
  // rota escopa o admin pelo próprio `institution_id` — o vínculo dele não é filtro.
  const adminWithInstitutionToken = jwtService.sign({
    sub: 'admin-2',
    email: 'admin2@test.com',
    type: 'admin',
    institution_id: 'institution-1',
  });

  // Gestor com token emitido ANTES do login passar a assinar a claim. Documenta a janela de
  // migração: até a rotação do `JWT_SECRET` ele se comporta como quem não tem vínculo.
  const staleManagerToken = jwtService.sign({
    sub: 'manager-1',
    email: 'manager@test.com',
    type: 'manager',
  });

  return {
    app,
    tokens: { adminToken, managerToken, userToken, adminWithInstitutionToken, staleManagerToken },
  };
}
