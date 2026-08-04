import * as bcrypt from 'bcrypt';
import 'dotenv/config';

import { createPrismaConnection, PrismaClient } from '../src';

// Mesma montagem de Pool + adapter usada pela aplicação, em vez de uma cópia local.
const { adapter, pool } = createPrismaConnection();
const prisma = new PrismaClient({ adapter });

const seedSellerId = 'seed-seller-1';
const seedInstitutionId = 'seed-institution-1';
const seedAdminId = 'seed-user-admin';
const seedManagerId = 'seed-user-manager';
const seedUserId = 'seed-user-student';
const seedMinorIds = ['seed-minor-1', 'seed-minor-2'] as const;

const seedPasswordAdmin = 'Admin@123';
const seedPasswordManager = 'Manager@123';
const seedPasswordUser = 'User@123';

const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);

type SeedUserInput = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  birthdate: string;
  cpf: string;
  rg: string;
  rg_emissor: string;
  type: 'admin' | 'manager' | 'user';
  institution_id?: string;
  address: {
    street: string;
    city: string;
    state: string;
    number: string;
    district: string;
    postal_code: string;
    complement?: string;
  };
};

async function seedSeller() {
  return prisma.seller.upsert({
    where: { id: seedSellerId },
    update: {
      name: 'Seed Seller',
      email: 'seller.seed@brasilmaisbolsas.local',
      password: await hashPassword('Seller@123'),
      active: true,
      delete: false,
    },
    create: {
      id: seedSellerId,
      name: 'Seed Seller',
      email: 'seller.seed@brasilmaisbolsas.local',
      password: await hashPassword('Seller@123'),
      active: true,
      delete: false,
    },
  });
}

async function seedInstitution() {
  return prisma.institution.upsert({
    where: { id: seedInstitutionId },
    update: {
      name: 'Instituição Seed',
      description: 'Instituição criada para seeds de desenvolvimento.',
      image: 'https://placehold.co/600x400',
      cnpj: '00000000000191',
      email: 'institution.seed@brasilmaisbolsas.local',
      phone: '11999990000',
      owner_name: 'Owner Seed',
      operator_name: 'Operator Seed',
      street: 'Rua Seed',
      number: '100',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01000000',
      seller_id: seedSellerId,
      active: true,
      delete: false,
      fake: false,
    },
    create: {
      id: seedInstitutionId,
      name: 'Instituição Seed',
      description: 'Instituição criada para seeds de desenvolvimento.',
      image: 'https://placehold.co/600x400',
      cnpj: '00000000000191',
      email: 'institution.seed@brasilmaisbolsas.local',
      phone: '11999990000',
      owner_name: 'Owner Seed',
      operator_name: 'Operator Seed',
      street: 'Rua Seed',
      number: '100',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01000000',
      seller_id: seedSellerId,
      active: true,
      delete: false,
      fake: false,
    },
  });
}

async function seedUser(user: SeedUserInput) {
  const hashedPassword = await hashPassword(user.password);
  const birthdate = new Date(user.birthdate);

  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      name: user.name,
      email: user.email,
      password: hashedPassword,
      phone: user.phone,
      birthdate,
      cpf: user.cpf,
      rg: user.rg,
      rg_emissor: user.rg_emissor,
      type: user.type,
      institution_id: user.institution_id,
      active: true,
      delete: false,
      address: {
        upsert: {
          create: {
            street: user.address.street,
            city: user.address.city,
            state: user.address.state,
            number: user.address.number,
            district: user.address.district,
            postal_code: user.address.postal_code,
            complement: user.address.complement,
          },
          update: {
            street: user.address.street,
            city: user.address.city,
            state: user.address.state,
            number: user.address.number,
            district: user.address.district,
            postal_code: user.address.postal_code,
            complement: user.address.complement,
          },
        },
      },
    },
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: hashedPassword,
      phone: user.phone,
      birthdate,
      cpf: user.cpf,
      rg: user.rg,
      rg_emissor: user.rg_emissor,
      type: user.type,
      institution_id: user.institution_id,
      active: true,
      delete: false,
      address: {
        create: {
          street: user.address.street,
          city: user.address.city,
          state: user.address.state,
          number: user.address.number,
          district: user.address.district,
          postal_code: user.address.postal_code,
          complement: user.address.complement,
        },
      },
    },
  });
}

async function seedMinors(userId: string) {
  return Promise.all(
    seedMinorIds.map((minorId, index) =>
      prisma.minor.upsert({
        where: { id: minorId },
        update: {
          user_id: userId,
          name: index === 0 ? 'Dependente Seed 1' : 'Dependente Seed 2',
          birthdate:
            index === 0
              ? new Date('2012-05-12T00:00:00.000Z')
              : new Date('2015-09-18T00:00:00.000Z'),
        },
        create: {
          id: minorId,
          user_id: userId,
          name: index === 0 ? 'Dependente Seed 1' : 'Dependente Seed 2',
          birthdate:
            index === 0
              ? new Date('2012-05-12T00:00:00.000Z')
              : new Date('2015-09-18T00:00:00.000Z'),
        },
      }),
    ),
  );
}

async function main() {
  await seedSeller();
  await seedInstitution();

  await seedUser({
    id: seedAdminId,
    name: 'Admin Seed',
    email: 'admin.seed@brasilmaisbolsas.local',
    password: seedPasswordAdmin,
    phone: '11990000001',
    birthdate: '1988-01-10T00:00:00.000Z',
    cpf: '11111111111',
    rg: '1000001',
    rg_emissor: 'SSP-SP',
    type: 'admin',
    address: {
      street: 'Rua Admin',
      city: 'São Paulo',
      state: 'SP',
      number: '10',
      district: 'Centro',
      postal_code: '01001000',
    },
  });

  await seedUser({
    id: seedManagerId,
    name: 'Manager Seed',
    email: 'manager.seed@brasilmaisbolsas.local',
    password: seedPasswordManager,
    phone: '11990000002',
    birthdate: '1989-02-11T00:00:00.000Z',
    cpf: '22222222222',
    rg: '1000002',
    rg_emissor: 'SSP-SP',
    type: 'manager',
    institution_id: seedInstitutionId,
    address: {
      street: 'Rua Manager',
      city: 'São Paulo',
      state: 'SP',
      number: '20',
      district: 'Bela Vista',
      postal_code: '01310000',
    },
  });

  await seedUser({
    id: seedUserId,
    name: 'User Seed',
    email: 'user.seed@brasilmaisbolsas.local',
    password: seedPasswordUser,
    phone: '11990000003',
    birthdate: '1992-03-12T00:00:00.000Z',
    cpf: '33333333333',
    rg: '1000003',
    rg_emissor: 'SSP-SP',
    type: 'user',
    address: {
      street: 'Rua User',
      city: 'São Paulo',
      state: 'SP',
      number: '30',
      district: 'Liberdade',
      postal_code: '01500000',
    },
  });

  await seedMinors(seedUserId);

  console.warn('Seed concluido com sucesso.');
  console.warn('Credenciais para authorize/login:');
  console.warn('Admin: admin.seed@brasilmaisbolsas.local / Admin@123');
  console.warn('Manager: manager.seed@brasilmaisbolsas.local / Manager@123');
  console.warn('User: user.seed@brasilmaisbolsas.local / User@123');
}

main()
  .catch((error: unknown) => {
    console.error('Erro ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
