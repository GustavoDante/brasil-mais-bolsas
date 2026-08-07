import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';

type CheckoutRequest = Request & { user?: JwtUser };

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // Cria usuário e chama o gateway: mesmo limite do cadastro público
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Contratar uma bolsa',
    description:
      'Cria a cobranca da bolsa no Asaas. Sem token, cria tambem o aluno a partir de ' +
      '`customer` e devolve o `accessToken` da sessao. Com token, o usuario e o do token e ' +
      '`customer` e ignorado.',
  })
  @ApiResponse({ status: 201, description: 'Cobranca criada.', type: CheckoutResponseDto })
  @ApiResponse({ status: 400, description: 'Bolsa invalida ou dados de cadastro ausentes.' })
  @ApiResponse({ status: 409, description: 'E-mail ou CPF ja cadastrado.' })
  @ApiResponse({ status: 422, description: 'Erro de validacao no payload.' })
  @ApiResponse({ status: 429, description: 'Limite de requisicoes (Rate limit) excedido.' })
  checkout(@Req() req: CheckoutRequest, @Body() dto: CheckoutDto): Promise<CheckoutResponseDto> {
    return this.checkoutService.checkout(req.user, dto, req.ip);
  }
}
