import { z } from 'zod';

import { zDateString, zId, zQueryOptionalInt, zText } from '../primitives';

export const GeneralReportQuerySchema = z
  .object({
    institution: zText('Informe a instituição'),
    course: zText('Informe o curso'),
    start_date: zDateString(),
    end_date: zDateString(),
  })
  .meta({ id: 'GeneralReportQuery' });

/** `days` chega como string na query — daí o bloco `zQuery*` em vez de `zInt`. */
export const RenewalsReportQuerySchema = z
  .object({
    days: zQueryOptionalInt({ min: 1 }),
  })
  .meta({ id: 'RenewalsReportQuery' });

export const PaymentsReportQuerySchema = z
  .object({
    order_id: zId('Informe o pedido'),
  })
  .meta({ id: 'PaymentsReportQuery' });

export type GeneralReportQuery = z.infer<typeof GeneralReportQuerySchema>;
export type RenewalsReportQuery = z.infer<typeof RenewalsReportQuerySchema>;
export type PaymentsReportQuery = z.infer<typeof PaymentsReportQuerySchema>;
