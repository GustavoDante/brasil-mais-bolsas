import {
  ChangeOrderScholarshipSchema,
  CreateOrderSchema,
  OrderIdParamSchema,
  OrderListQuerySchema,
  OrderPaymentsQuerySchema,
  OrderVoucherQuerySchema,
  UpdateOrderDefaulterSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

export class OrderIdParamDto extends createZodDto(OrderIdParamSchema) {}

export class ChangeOrderScholarshipDto extends createZodDto(ChangeOrderScholarshipSchema) {}

export class UpdateOrderDefaulterDto extends createZodDto(UpdateOrderDefaulterSchema) {}

export class OrderVoucherQueryDto extends createZodDto(OrderVoucherQuerySchema) {}

export class OrderPaymentsQueryDto extends createZodDto(OrderPaymentsQuerySchema) {}

/**
 * `page`, `limit` e os booleanos chegam como string na query. A coercao vive nos blocos
 * `zQuery*` do contrato — antes era um `@Transform` escrito a mao neste arquivo.
 */
export class OrderListQueryDto extends createZodDto(OrderListQuerySchema) {}
