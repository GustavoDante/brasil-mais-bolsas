import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { AccessModule } from './modules/access/access.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuthModule } from './modules/auth/auth.module';
import { CallsModule } from './modules/calls/calls.module';
import { ContactModule } from './modules/contact/contact.module';
import { CourseCategoriesModule } from './modules/course-categories/course-categories.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ExternalClientsModule } from './modules/external-clients/external-clients.module';
import { FaqModule } from './modules/faq/faq.module';
import { IndicationsModule } from './modules/indications/indications.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { MinorsModule } from './modules/minors/minors.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PartnersModule } from './modules/partners/partners.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PossiblePartnersModule } from './modules/possible-partners/possible-partners.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ScholarshipsModule } from './modules/scholarships/scholarships.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { SignedContractsModule } from './modules/signed-contracts/signed-contracts.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UserIdentitiesModule } from './modules/user-identities/user-identities.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const missing: string[] = [];
        if (!config.JWT_SECRET) missing.push('JWT_SECRET');
        if (!config.DATABASE_URL) missing.push('DATABASE_URL');
        if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    // Habilita o agendador (@Cron); os jobs em si ficam no JobsModule.
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    AccessModule,
    AddressesModule,
    InstitutionsModule,
    CourseCategoriesModule,
    CoursesModule,
    ScholarshipsModule,
    OrdersModule,
    PaymentsModule,
    SellersModule,
    PartnersModule,
    ExternalClientsModule,
    SignedContractsModule,
    UserIdentitiesModule,
    MinorsModule,
    ContactModule,
    CallsModule,
    FaqModule,
    NotificationsModule,
    IndicationsModule,
    PossiblePartnersModule,
    ReportsModule,
    UploadsModule,
    JobsModule,
  ],
  providers: [
    // Aplica ThrottlerGuard globalmente em todas as rotas
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
