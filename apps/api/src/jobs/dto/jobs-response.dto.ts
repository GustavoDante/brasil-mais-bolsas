import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduledJobDto {
  @ApiProperty({ description: 'Nome registrado do job', example: 'orders-renewal' })
  name!: string;

  @ApiProperty({ description: 'Expressão cron do agendamento', example: '0 3 * * *' })
  cron_time!: string;

  @ApiProperty({ description: 'Fuso horário do agendamento', example: 'America/Sao_Paulo' })
  time_zone!: string;

  @ApiProperty({ description: 'Se o agendamento está ativo', example: true })
  active!: boolean;

  @ApiPropertyOptional({
    description: 'Próxima execução prevista (ISO 8601)',
    example: '2026-08-01T03:00:00.000-03:00',
  })
  next_run?: string | null;

  @ApiPropertyOptional({
    description: 'Última execução (ISO 8601)',
    example: '2026-07-31T03:00:00.000-03:00',
  })
  last_run?: string | null;
}

export class ScheduledJobListResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: [ScheduledJobDto] })
  jobs!: ScheduledJobDto[];
}

export class OrdersRenewalItemDto {
  @ApiProperty({ example: 'cuid-order-id' })
  order_id!: string;

  @ApiProperty({ example: 'cuid-user-id' })
  user_id!: string;

  @ApiProperty({ enum: ['renewed', 'skipped', 'failed'], example: 'renewed' })
  outcome!: string;

  @ApiPropertyOptional({ example: 'renovacao-pendente' })
  reason?: string;

  @ApiPropertyOptional({ example: 'cuid-renewal-order-id' })
  renewal_order_id?: string;

  @ApiPropertyOptional({ description: 'Valor cobrado na renovação', example: 300.15 })
  value?: number;
}

export class OrdersRenewalSummaryDto {
  @ApiProperty({ example: '2026-07-31T06:00:00.000Z' })
  started_at!: string;

  @ApiProperty({ example: '2026-07-31T06:00:04.512Z' })
  finished_at!: string;

  @ApiProperty({ example: 4512 })
  duration_ms!: number;

  @ApiProperty({ description: 'Pedidos avaliados na janela de renovação', example: 12 })
  scanned!: number;

  @ApiProperty({ description: 'Renovações criadas', example: 9 })
  renewed!: number;

  @ApiProperty({ description: 'Pedidos ignorados (ex.: renovação já pendente)', example: 3 })
  skipped!: number;

  @ApiProperty({ description: 'Pedidos com falha', example: 0 })
  failed!: number;

  @ApiProperty({ type: [OrdersRenewalItemDto] })
  items!: OrdersRenewalItemDto[];
}

export class OrdersRenewalRunResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: OrdersRenewalSummaryDto })
  summary!: OrdersRenewalSummaryDto;
}
