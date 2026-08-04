import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import {
  ChangeOrderScholarshipDto,
  CreateOrderDto,
  OrderIdParamDto,
  OrderListQueryDto,
  OrderPaymentsQueryDto,
  OrderVoucherQueryDto,
  UpdateOrderDefaulterDto,
} from './dto/orders.dto';
import { OrdersService } from './orders.service';
import { AppException } from '../../common/exceptions/app.exception';

type OrderRequest = Request & {
  user: JwtUser & { institution_id?: string | null };
};

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar pedido manualmente (admin)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Pedido criado.' })
  @ApiResponse({ status: 403, description: 'Nao autorizado.' })
  create(@Body() dto: CreateOrderDto, @Req() req: OrderRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos.' })
  async findAll(@Req() req: OrderRequest, @Query() query: OrderListQueryDto) {
    const orders = await this.ordersService.findAll(req.user, query);
    return { ok: true, orders };
  }

  @Get('expired')
  @ApiOperation({ summary: 'Listar pedidos expirados ou de renovacao' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos expirados/renovacao.' })
  async findExpired(@Req() req: OrderRequest) {
    const orders = await this.ordersService.findExpired(req.user);
    return { ok: true, orders };
  }

  @Get('voucher')
  @ApiOperation({ summary: 'Buscar voucher do usuario para uma bolsa paga' })
  @ApiQuery({ name: 'scholarship_id', required: true })
  @ApiResponse({ status: 200, description: 'Voucher encontrado ou null.' })
  async findVoucher(@Req() req: OrderRequest, @Query() query: OrderVoucherQueryDto) {
    const voucher = await this.ordersService.findVoucher(req.user, query.scholarship_id);
    return { ok: true, voucher };
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos de um pedido' })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos.' })
  async findPayments(@Req() req: OrderRequest, @Query() query: OrderPaymentsQueryDto) {
    const payments = await this.ordersService.findPayments(req.user, query.order_id);
    return { ok: true, payments };
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado.' })
  async findById(@Param() params: OrderIdParamDto, @Req() req: OrderRequest) {
    const order = await this.ordersService.findById(params.id, req.user);
    return { ok: true, order };
  }

  @Put('change')
  @ApiOperation({ summary: 'Alterar bolsa vinculada ao pedido (admin)' })
  @ApiBody({ type: ChangeOrderScholarshipDto })
  @ApiResponse({ status: 200, description: 'Pedido atualizado.' })
  async changeScholarship(@Body() dto: ChangeOrderScholarshipDto, @Req() req: OrderRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const order = await this.ordersService.changeScholarship(dto);
    return { ok: true, order };
  }

  @Post('update-defaulter')
  @ApiOperation({ summary: 'Atualizar inadimplencia de um pedido' })
  @ApiBody({ type: UpdateOrderDefaulterDto })
  @ApiResponse({ status: 200, description: 'Status de inadimplencia atualizado.' })
  updateDefaulter(@Body() dto: UpdateOrderDefaulterDto, @Req() req: OrderRequest) {
    return this.ordersService.updateDefaulter(req.user, dto);
  }
}
