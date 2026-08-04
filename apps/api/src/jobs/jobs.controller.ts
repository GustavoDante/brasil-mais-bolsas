import { Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CronJob } from 'cron';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import {
  OrdersRenewalRunResponseDto,
  ScheduledJobDto,
  ScheduledJobListResponseDto,
} from './dto/jobs-response.dto';
import { JOBS_TIMEZONE } from './jobs.config';
import { OrdersRenewalService } from './orders-renewal/orders-renewal.service';

interface AuthenticatedRequest {
  user: { userId: string; email: string; type: string };
}

/**
 * Operação dos agendamentos: consultar o que está registrado e disparar manualmente.
 * A API antiga não tinha isso — para testar o job era preciso descomentar código e
 * subir a aplicação.
 */
@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly ordersRenewalService: OrdersRenewalService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos registrados (Admin)' })
  @ApiResponse({ status: 200, type: ScheduledJobListResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  list(@Req() req: AuthenticatedRequest): ScheduledJobListResponseDto {
    this.assertAdmin(req);

    const jobs: ScheduledJobDto[] = [...this.schedulerRegistry.getCronJobs().entries()].map(
      ([name, job]) => ({
        name,
        cron_time: String(job.cronTime.source),
        time_zone: JOBS_TIMEZONE,
        active: job.isActive,
        next_run: this.nextRun(job),
        last_run: job.lastExecution ? job.lastExecution.toISOString() : null,
      }),
    );

    return { ok: true, jobs };
  }

  @Post('orders-renewal/run')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @ApiOperation({
    summary: 'Executar a renovação de pedidos agora (Admin)',
    description:
      'Roda a mesma rotina do agendamento diário e devolve o resumo do que foi renovado, ' +
      'ignorado ou falhou. Útil para operação e para validar o comportamento sem esperar as 03:00.',
  })
  @ApiResponse({ status: 201, type: OrdersRenewalRunResponseDto })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 429, description: 'Muitas execuções — tente novamente em 1 minuto' })
  async runOrdersRenewal(@Req() req: AuthenticatedRequest): Promise<OrdersRenewalRunResponseDto> {
    this.assertAdmin(req);
    const summary = await this.ordersRenewalService.run();
    return { ok: true, summary };
  }

  private assertAdmin(req: AuthenticatedRequest): void {
    if (req.user?.type !== 'admin') throw new ForbiddenException('unauthorized');
  }

  private nextRun(job: CronJob): string | null {
    try {
      return job.nextDate().toISO();
    } catch {
      return null;
    }
  }
}
