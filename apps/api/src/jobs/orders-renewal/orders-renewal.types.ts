export type OrdersRenewalOutcome = 'renewed' | 'skipped' | 'failed';

export interface OrdersRenewalItem {
  order_id: string;
  user_id: string;
  outcome: OrdersRenewalOutcome;
  /** Motivo do skip/falha, em formato de slug (usado em log e no retorno da rota manual). */
  reason?: string;
  renewal_order_id?: string;
  value?: number;
}

export interface OrdersRenewalSummary {
  started_at: string;
  finished_at: string;
  duration_ms: number;
  /** Pedidos que entraram na janela de renovação. */
  scanned: number;
  renewed: number;
  skipped: number;
  failed: number;
  items: OrdersRenewalItem[];
}

export interface OrdersRenewalOptions {
  /** Dias após o pagamento em que a renovação é disparada (legado: 180). */
  triggerDays: number;
  /**
   * Janela extra em dias. O job legado só renovava quando a diferença era exatamente
   * `triggerDays`, então qualquer dia sem execução perdia a renovação para sempre.
   * A janela recupera esses casos sem cobrar retroativamente todo o histórico.
   */
  graceDays: number;
  /** Percentual da mensalidade cheia cobrado na renovação (legado: 30). */
  percent: number;
  /** Parcelas máximas oferecidas no link de pagamento (legado: 4). */
  maxInstallments: number;
  /** Dias de validade do link de pagamento (legado: 3). */
  dueDateLimitDays: number;
}

export const ORDERS_RENEWAL_DEFAULTS: OrdersRenewalOptions = {
  triggerDays: 180,
  graceDays: 7,
  percent: 30,
  maxInstallments: 4,
  dueDateLimitDays: 3,
};

export const ORDERS_RENEWAL_JOB_NAME = 'orders-renewal';
