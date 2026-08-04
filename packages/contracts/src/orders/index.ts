import { z } from 'zod';

import { apiEnvelope } from '../common';
import { OrderSchema } from '../models';
import { zBoolean, zId, zOptionalBoolean, zQueryInt, zQueryOptionalBoolean } from '../primitives';

export const CreateOrderSchema = z
  .object({
    user_id: zId('Informe o usuário'),
    scholarship_id: zId('Informe a bolsa'),
    is_renew: zOptionalBoolean(),
  })
  .strict()
  .meta({ id: 'CreateOrder' });

export const OrderIdParamSchema = z
  .object({ id: zId('Informe o pedido') })
  .meta({ id: 'OrderIdParam' });

export const ChangeOrderScholarshipSchema = z
  .object({
    orderId: zId('Informe o pedido'),
    newScholarshipId: zId('Informe a nova bolsa'),
  })
  .strict()
  .meta({ id: 'ChangeOrderScholarship' });

export const UpdateOrderDefaulterSchema = z
  .object({
    order_id: zId('Informe o pedido'),
    defaulter: zBoolean(),
  })
  .strict()
  .meta({ id: 'UpdateOrderDefaulter' });

export const OrderVoucherQuerySchema = z
  .object({ scholarship_id: zId('Informe a bolsa') })
  .meta({ id: 'OrderVoucherQuery' });

export const OrderPaymentsQuerySchema = z
  .object({ order_id: zId('Informe o pedido') })
  .meta({ id: 'OrderPaymentsQuery' });

/**
 * Os booleanos chegam como `"true"`/`"false"` na query — o `@Transform` do DTO antigo
 * fazia essa conversão à mão; aqui é o `zQueryOptionalBoolean`. `page` e `limit` mantêm
 * os mesmos defaults (1 e 20) e o teto de 100.
 */
export const OrderListQuerySchema = z
  .object({
    user_id: z.string().optional(),
    expired: zQueryOptionalBoolean(),
    is_renew: zQueryOptionalBoolean(),
    defaulter: zQueryOptionalBoolean(),
    page: zQueryInt({ min: 1 }).default(1),
    limit: zQueryInt({ min: 1, max: 100 }).default(20),
  })
  .meta({ id: 'OrderListQuery' });

export const OrderResponseSchema = OrderSchema.meta({ id: 'OrderResponse' });

export const OrderEnvelopeSchema = apiEnvelope('order', OrderResponseSchema);
export const OrderListEnvelopeSchema = apiEnvelope('orders', z.array(OrderResponseSchema));

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type ChangeOrderScholarshipInput = z.infer<typeof ChangeOrderScholarshipSchema>;
export type UpdateOrderDefaulterInput = z.infer<typeof UpdateOrderDefaulterSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
