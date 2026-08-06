import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { RegisterDto } from '../users/dto/register.dto';
import type { UserSafe } from '../users/types/user-safe.type';
import { AuthService } from './auth.service';
import { AuthProfileDto } from './dto/auth-profile.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/password-recovery.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

type AuthenticatedRequest = Request & { user: UserSafe };

type JwtAuthenticatedRequest = Request & {
  user: { userId: string; email: string; type: string; institution_id?: string };
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Autenticar usuario' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas — tente novamente em 1 minuto' })
  @Post('login')
  async login(@Req() req: AuthenticatedRequest): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  // Cadastro é caro (cria usuário + endereço + notificações + e-mail): limite bem menor
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @ApiOperation({
    summary: 'Cadastro público de aluno',
    description:
      'Cria o usuário com `type: user`, envia o e-mail de boas-vindas e já devolve o token ' +
      'de acesso. A senha inicial é o CPF (apenas números).',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({ status: 409, description: 'Email já está em uso / CPF já cadastrado' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas — tente novamente em 1 minuto' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('forgot_password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Envia o link de redefinição por e-mail. A resposta é sempre a mesma, exista ou não a ' +
      'conta, para a rota não servir de verificador de e-mails cadastrados.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, type: ForgotPasswordResponseDto })
  @ApiResponse({ status: 400, description: 'E-mail inválido' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas — tente novamente em 1 minuto' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    await this.authService.forgotPassword(dto.email);
    return { ok: true, message: 'password-reset-requested' };
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('password_reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Redefinir a senha com o token recebido por e-mail',
    description: 'O token é de uso único e expira em 24 horas (configurável).',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, type: ResetPasswordResponseDto })
  @ApiResponse({
    status: 400,
    description: 'token-not-found-or-expired | passwords-not-matching | payload inválido',
  })
  @ApiResponse({ status: 429, description: 'Muitas tentativas — tente novamente em 1 minuto' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    await this.authService.resetPassword(dto.token, dto.password, dto.repassword);
    return { ok: true, message: 'password-updated' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do token' })
  @ApiResponse({ status: 200, type: AuthProfileDto })
  @Get('me')
  getProfile(@Req() req: JwtAuthenticatedRequest): AuthProfileDto {
    // Devolve o que está no token, sem consultar o banco. Um fallback só aqui faria esta
    // rota mentir: ela reportaria o gestor escopado enquanto `/institutions`, `/courses`,
    // `/scholarships` e `/reports` continuariam lendo a claim vazia do mesmo token. O lugar
    // honesto para um fallback seria o `JwtStrategy`, ao custo de um SELECT por requisição
    // em toda rota autenticada — a janela se fecha rotacionando `JWT_SECRET` no deploy.
    // A normalização para `null` é o que distingue "sem vínculo" de "chave ausente" no web.
    return { ...req.user, institution_id: req.user.institution_id ?? null };
  }
}
