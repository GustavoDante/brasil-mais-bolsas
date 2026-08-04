import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AsaasWebhookDto } from './dto/asaas-webhook.dto';
import { CreateCreditCardPaymentDto } from './dto/create-credit-card-payment.dto';
import { CreateInterestPaymentDto } from './dto/create-interest-payment.dto';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import {
  AsaasWebhookResponseDto,
  CreditCardPaymentResponseDto,
  InterestPaymentResponseDto,
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

  @Post('create-interest-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar pagamento de interesse para uma bolsa',
    description: 'Gera uma cobranca de interesse (PIX) para reservar uma bolsa.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pagamento criado com sucesso.',
    type: InterestPaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Pagamento ja existente ou dados invalidos.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou invalido.' })
  @ApiResponse({ status: 429, description: 'Limite de requisicoes (Rate limit) excedido.' })
  createInterestPayment(
    @Req() req: AuthenticatedPaymentRequest,
    @Body() createDto: CreateInterestPaymentDto,
  ): Promise<InterestPaymentResponseDto> {
    return this.paymentsService.createInterestPayment(req.user.userId, createDto);
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
