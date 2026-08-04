import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JOBS_TIMEZONE, JOBS_DISABLED } from '../jobs.config';
import { OrdersRenewalService } from './orders-renewal.service';
import { ORDERS_RENEWAL_JOB_NAME } from './orders-renewal.types';

/** Padrão do legado: todo dia às 03:00 (America/Sao_Paulo). */
const ORDERS_RENEWAL_CRON = process.env['ORDERS_RENEWAL_CRON'] ?? '0 3 * * *';

/**
 * Agendamento da renovação de pedidos. Esta classe só cuida do "quando";
 * o "o quê" fica no {@link OrdersRenewalService}, que é testável isoladamente e pode ser
 * disparado sob demanda pela rota administrativa `POST /v1/jobs/orders-renewal/run`.
 */
@Injectable()
export class OrdersRenewalJob {
  private readonly logger = new Logger(OrdersRenewalJob.name);

  constructor(private readonly ordersRenewalService: OrdersRenewalService) {}

  @Cron(ORDERS_RENEWAL_CRON, {
    name: ORDERS_RENEWAL_JOB_NAME,
    timeZone: JOBS_TIMEZONE,
    // Evita execuções sobrepostas caso uma rodada demore mais que o intervalo.
    waitForCompletion: true,
    // Não segura o processo aberto (importante em testes e em scripts).
    unrefTimeout: true,
    disabled: JOBS_DISABLED,
  })
  async handle(): Promise<void> {
    try {
      await this.ordersRenewalService.run();
    } catch (error) {
      // O agendador engole exceções silenciosamente; logamos explicitamente.
      this.logger.error(
        `execução agendada de ${ORDERS_RENEWAL_JOB_NAME} falhou: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
