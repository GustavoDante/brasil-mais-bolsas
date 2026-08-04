import { type INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { DurationType, ScholarshipType } from '@repo/db';
import { AuthService } from '../src/modules/auth/auth.service';
import { CourseCategoriesService } from '../src/modules/course-categories/course-categories.service';
import { CoursesService } from '../src/modules/courses/courses.service';
import { InstitutionsService } from '../src/modules/institutions/institutions.service';
import { ScholarshipsService } from '../src/modules/scholarships/scholarships.service';
import { UsersService } from '../src/modules/users/users.service';

type GenericObject = Record<string, unknown>;

const authServiceMock = {
  validateUser: jest.fn<Promise<GenericObject | null>, [string, string]>(),
  login: jest.fn<Promise<GenericObject>, [GenericObject]>(),
};

const usersServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findByIdWithAddress: jest.fn<Promise<GenericObject | null>, [string]>(),
  create: jest.fn<Promise<GenericObject>, [GenericObject]>(),
  update: jest.fn<Promise<GenericObject>, [string, GenericObject]>(),
  toggleActive: jest.fn<Promise<GenericObject>, [string]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
};

const coursesServiceMock = {
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

const courseCategoriesServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, []>(),
  findById: jest.fn<Promise<GenericObject | null>, [string]>(),
  findByOldId: jest.fn<Promise<GenericObject | null>, [string]>(),
  create: jest.fn<Promise<void>, [GenericObject]>(),
  update: jest.fn<Promise<void>, [string, GenericObject]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
  toggleActive: jest.fn<Promise<void>, [string]>(),
};

const institutionsServiceMock = {
  findAll: jest.fn<Promise<GenericObject[]>, [string, string, string | undefined]>(),
  searchByName: jest.fn<Promise<GenericObject[]>, [string]>(),
  searchByCity: jest.fn<Promise<GenericObject[]>, [string]>(),
  findById: jest.fn<Promise<GenericObject | null>, [string]>(),
  findByOldId: jest.fn<Promise<GenericObject | null>, [string]>(),
  create: jest.fn<Promise<void>, [GenericObject]>(),
  update: jest.fn<Promise<void>, [string, GenericObject]>(),
  toggleActive: jest.fn<Promise<void>, [string]>(),
  softDelete: jest.fn<Promise<void>, [string]>(),
};

const scholarshipsServiceMock = {
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

describe('API Flows (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let managerToken = '';
  let userToken = '';

  const validUser = {
    id: 'user-1',
    name: 'Usuario Teste',
    email: 'user@test.com',
    type: 'user',
    active: true,
    password: 'hash',
    reset_password_token: null,
    reset_password_expires: null,
  };

  const adminUser = {
    ...validUser,
    id: 'admin-1',
    email: 'admin@test.com',
    type: 'admin',
  };

  const validCreateUserPayload = {
    name: 'Novo Usuario',
    email: 'novo@email.com',
    phone: '11999999999',
    birthdate: '1990-01-01',
    cpf: '12345678901',
    rg: '1234567',
    rg_emissor: 'SSP-SP',
  };

  const validCreateCoursePayload = {
    name: 'Administracao',
    duration: 8,
    duration_type: DurationType.MONTHS,
    category_id: 'category-1',
  };

  const validCreateCategoryPayload = {
    name: 'Graduacao',
    order: 1,
  };

  const validCreateInstitutionPayload = {
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

  const validCreateScholarshipPayload = {
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

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.JWT_EXPIRES_IN = '1h';

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

    usersServiceMock.findAll.mockResolvedValue([adminUser, validUser]);
    usersServiceMock.findByIdWithAddress.mockResolvedValue(validUser);
    usersServiceMock.create.mockResolvedValue({ ...validUser, ...validCreateUserPayload });
    usersServiceMock.update.mockResolvedValue({ ...validUser, name: 'Nome Atualizado' });
    usersServiceMock.toggleActive.mockResolvedValue({ ...validUser, active: false });
    usersServiceMock.softDelete.mockResolvedValue();

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

    courseCategoriesServiceMock.findAll.mockResolvedValue([
      { id: 'category-1', name: 'Graduacao' },
    ]);
    courseCategoriesServiceMock.findById.mockResolvedValue({ id: 'category-1', name: 'Graduacao' });
    courseCategoriesServiceMock.findByOldId.mockResolvedValue({ id: 'legacy-category-1' });
    courseCategoriesServiceMock.create.mockResolvedValue();
    courseCategoriesServiceMock.update.mockResolvedValue();
    courseCategoriesServiceMock.softDelete.mockResolvedValue();
    courseCategoriesServiceMock.toggleActive.mockResolvedValue();

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
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    // Mesmo pipe do `main.ts`. O `ValidationPipe` do class-validator nao pode voltar aqui:
    // ao ver um `ZodDto` (que nao tem decorators) com `whitelist`/`forbidNonWhitelisted`,
    // ele rejeita todos os campos do corpo e a rota responde 400.
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const jwtService = app.get(JwtService);
    adminToken = jwtService.sign({ sub: 'admin-1', email: 'admin@test.com', type: 'admin' });
    managerToken = jwtService.sign({
      sub: 'manager-1',
      email: 'manager@test.com',
      type: 'manager',
    });
    userToken = jwtService.sign({ sub: 'user-1', email: 'user@test.com', type: 'user' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth (e2e)', () => {
    it('POST /v1/auth/login deve retornar 401 com credenciais invalidas', () =>
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'naoexiste@test.com', password: '123456' })
        .expect(401));

    it('POST /v1/auth/login deve retornar 401 com email invalido', () =>
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'nao-e-email', password: '123456' })
        .expect(401));

    it('POST /v1/auth/login deve ignorar campo extra e retornar 201 com credenciais validas', () =>
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'admin@test.com', password: '123456', admin: true })
        .expect(201));

    it('POST /v1/auth/login deve retornar 201 com credenciais validas', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'admin@test.com', password: '123456' })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('POST /v1/auth/login deve retornar 429 apos excesso de tentativas', async () => {
      let gotRateLimit = false;

      for (let index = 0; index < 11; index += 1) {
        const response = await request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({ email: 'naoexiste@test.com', password: '123456' });
        if (response.status === 429) {
          gotRateLimit = true;
          break;
        }
      }

      expect(gotRateLimit).toBe(true);
    });

    it('GET /v1/auth/me deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/auth/me').expect(401));

    it('GET /v1/auth/me deve retornar 200 com token valido', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.userId).toBe('admin-1');
      expect(response.body.type).toBe('admin');
    });
  });

  describe('Users (e2e)', () => {
    it('GET /v1/users deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/users').expect(401));

    it('GET /v1/users deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('GET /v1/users deve retornar 200 para admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('GET /v1/users/me deve retornar 200 com token valido', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe('user@test.com');
      expect(response.body.password).toBeUndefined();
    });

    it('GET /v1/users/:id deve retornar 403 para usuario comum acessando outro id', () =>
      request(app.getHttpServer())
        .get('/v1/users/other-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('POST /v1/users deve retornar 400 quando payload nao atende validacao', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateUserPayload)
        .expect(400));
  });

  describe('Courses (e2e)', () => {
    it('GET /v1/courses deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/courses').expect(401));

    it('GET /v1/courses deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/courses')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('GET /v1/courses/institution/:id deve retornar 200 (publico)', () =>
      request(app.getHttpServer()).get('/v1/courses/institution/faculdade').expect(200));

    it('POST /v1/courses deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .post('/v1/courses')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateCoursePayload)
        .expect(403));

    it('POST /v1/courses deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCoursePayload)
        .expect(201));
  });

  describe('Course Categories (e2e)', () => {
    it('GET /v1/course-categories deve retornar 200 (publico)', () =>
      request(app.getHttpServer()).get('/v1/course-categories').expect(200));

    it('GET /v1/course-categories/:id deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/course-categories/category-1').expect(401));

    it('POST /v1/course-categories deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .post('/v1/course-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateCategoryPayload)
        .expect(403));

    it('POST /v1/course-categories deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/course-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCategoryPayload)
        .expect(201));
  });

  describe('Institutions (e2e)', () => {
    it('GET /v1/institutions deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/institutions').expect(401));

    it('GET /v1/institutions deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/institutions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('GET /v1/institutions/search deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/institutions/search?term=fac')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('POST /v1/institutions deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .post('/v1/institutions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateInstitutionPayload)
        .expect(403));

    it('POST /v1/institutions deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/institutions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateInstitutionPayload)
        .expect(201));
  });

  describe('Scholarships (e2e)', () => {
    it('GET /v1/scholarships/search/city deve retornar 200 (publico)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/search/city?term=sao').expect(200));

    it('GET /v1/scholarships/list/city deve retornar 200 (publico)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/list/city').expect(200));

    it('GET /v1/scholarships deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships').expect(401));

    it('GET /v1/scholarships deve retornar 200 com token de manager', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('GET /v1/scholarships/list/backoffice deve retornar 403 para user', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/backoffice')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('GET /v1/scholarships/list/backoffice deve retornar 200 para manager', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/backoffice')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('POST /v1/scholarships deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateScholarshipPayload)
        .expect(403));

    it('POST /v1/scholarships deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateScholarshipPayload)
        .expect(201));

    it('GET /v1/scholarships/students_count/:id deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/students_count/scholarship-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('GET /v1/scholarships/students_count/:id deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/students_count/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
