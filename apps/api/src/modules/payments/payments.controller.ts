import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { Payment } from '@repo/db';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AsaasWebhookDto } from './dto/asaas-webhook.dto';
import { CreateBoletoPaymentDto } from './dto/create-boleto-payment.dto';
import { CreateCreditCardPaymentDto } from './dto/create-credit-card-payment.dto';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import {
  AsaasWebhookResponseDto,
  BoletoPaymentResponseDto,
  CreditCardPaymentResponseDto,
  PixPaymentResponseDto,
} from './dto/payments-response.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedPaymentRequest = Request & {
  user: JwtUser;
};

@ApiTags('payments')
@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('credit_card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar pagamento com cartao de credito via Asaas',
    description: 'Processa o pagamento com cartao de credito e registra a cobranca no Asaas.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pagamento criado com sucesso.',
    type: CreditCardPaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invalidos ou bolsa nao encontrada.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou invalido.' })
  @ApiResponse({ status: 422, description: 'Erro de validacao no payload.' })
  @ApiResponse({ status: 429, description: 'Limite de requisicoes (Rate limit) excedido.' })
  createCreditCardPayment(
    @Req() req: AuthenticatedPaymentRequest,
    @Body() createDto: CreateCreditCardPaymentDto,
  ): Promise<CreditCardPaymentResponseDto> {
    return this.paymentsService.createCreditCardPayment(req.user.userId, createDto);
  }

  @Post('asaas/boleto')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar cobranca por boleto via Asaas',
    description: 'Gera o boleto no Asaas e devolve o link e a linha digitavel.',
  })
  @ApiResponse({
    status: 201,
    description: 'Boleto criado com sucesso.',
    type: BoletoPaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invalidos ou erro no Asaas.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou invalido.' })
  @ApiResponse({ status: 429, description: 'Limite de requisicoes (Rate limit) excedido.' })
  createBoletoPayment(
    @Req() req: AuthenticatedPaymentRequest,
    @Body() createDto: CreateBoletoPaymentDto,
  ): Promise<BoletoPaymentResponseDto> {
    return this.paymentsService.createBoletoPayment(req.user.userId, createDto);
  }

  @Post('asaas/pix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar pagamento PIX via Asaas',
    description: 'Gera uma cobranca PIX no Asaas e retorna o QR Code.',
  })
  @ApiResponse({
    status: 201,
    description: 'Cobranca PIX criada com sucesso.',
    type: PixPaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados invalidos ou erro no Asaas.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou invalido.' })
  @ApiResponse({ status: 429, description: 'Limite de requisicoes (Rate limit) excedido.' })
  createPixPayment(
    @Req() req: AuthenticatedPaymentRequest,
    @Body() createDto: CreatePixPaymentDto,
  ): Promise<PixPaymentResponseDto> {
    return this.paymentsService.createPixPayment(req.user.userId, createDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar um pagamento do proprio usuario',
    description:
      'Devolve o pagamento com o status atualizado pelo webhook. E a rota que a tela de ' +
      'acompanhamento consulta enquanto o PIX ou o boleto nao sao confirmados.',
  })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou invalido.' })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado.' })
  async findOne(
    @Req() req: AuthenticatedPaymentRequest,
    @Param('id') id: string,
  ): Promise<{ ok: boolean; payment: Payment }> {
    const payment = await this.paymentsService.findOwnPayment(req.user.userId, id);
    return { ok: true, payment };
  }

  @Post('asaas/webhook')
  @ApiOperation({
    summary: 'Receber eventos de pagamento do Asaas',
    description: 'Endpoint publico chamado pelo Asaas para notificar mudancas de status.',
  })
  @ApiHeader({
    name: 'asaas-access-token',
    description: 'Token de seguranca configurado no webhook do Asaas',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Evento processado com sucesso.',
    type: AsaasWebhookResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token do webhook invalido.' })
  @ApiResponse({ status: 404, description: 'Pagamento nao encontrado para o ID fornecido.' })
  handleAsaasWebhook(
    @Headers('asaas-access-token') accessToken: string | undefined,
    @Body() dto: AsaasWebhookDto,
  ): Promise<AsaasWebhookResponseDto> {
    return this.paymentsService.handleAsaasWebhook(accessToken, dto);
  }
}
