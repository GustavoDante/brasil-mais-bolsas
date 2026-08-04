import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { AsaasModule } from '../integrations/asaas/asaas.module';
import { JobsController } from './jobs.controller';
import { OrdersRenewalJob } from './orders-renewal/orders-renewal.job';
import { OrdersRenewalService } from './orders-renewal/orders-renewal.service';

/**
 * Tarefas agendadas da aplicação.
 *
 * Cada job tem duas partes: um `*.service.ts` com a regra de negócio (testável e
 * executável sob demanda) e um `*.job.ts` só com o agendamento (`@Cron`).
 * O `ScheduleModule.forRoot()` é registrado no `AppModule`.
 */
@Module({
  imports: [PrismaModule, AsaasModule],
  controllers: [JobsController],
  providers: [OrdersRenewalService, OrdersRenewalJob],
  exports: [OrdersRenewalService],
})
export class JobsModule {}
