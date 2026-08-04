import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AsaasModule } from '../../integrations/asaas/asaas.module';
import { MailModule } from '../../integrations/mail/mail.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, AuthModule, AsaasModule, OrdersModule, MailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
