import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { AdminUpdateUserDto, CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UserListResponseDto, UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { AppException } from '../../common/exceptions/app.exception';

type JwtRequest = Request & { user: JwtUser };

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Admin: listar todos ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuarios (admin)' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findAll(@Req() req: JwtRequest): Promise<UserListResponseDto> {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const users = await this.usersService.findAll();
    return { users };
  }

  // ── Perfil do proprio usuario ────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Retorna perfil completo do usuario autenticado' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMe(@Req() req: JwtRequest): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdWithAddress(req.user.userId);
    if (!user) throw new AppException('user-not-found');
    const { password: _p, reset_password_token: _rt, reset_password_expires: _re, ...safe } = user;
    return safe;
  }

  // ── Buscar por ID ────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuario por ID (admin ou proprio usuario)' })
  @ApiParam({ name: 'id', description: 'ID do usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id') id: string, @Req() req: JwtRequest): Promise<UserResponseDto> {
    const targetId = req.user.type === 'admin' ? id : req.user.userId;
    if (req.user.type !== 'admin' && req.user.userId !== id) {
      throw new AppException('forbidden');
    }

    const user = await this.usersService.findByIdWithAddress(targetId);
    if (!user) throw new AppException('user-not-found');
    const { password: _p, reset_password_token: _rt, reset_password_expires: _re, ...safe } = user;
    return safe;
  }

  // ── Criar usuario (admin) ────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Criar usuario (admin)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  async create(@Body() dto: CreateUserDto, @Req() req: JwtRequest): Promise<UserResponseDto> {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const user = await this.usersService.create(dto);
    const { password: _p, reset_password_token: _rt, reset_password_expires: _re, ...safe } = user;
    return safe;
  }

  // ── Atualizar proprio perfil ─────────────────────────────────────────────

  @Put('me')
  @ApiOperation({ summary: 'Atualizar proprio perfil' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(@Body() dto: UpdateUserDto, @Req() req: JwtRequest): Promise<UserResponseDto> {
    const user = await this.usersService.update(req.user.userId, dto);
    const { password: _p, reset_password_token: _rt, reset_password_expires: _re, ...safe } = user;
    return safe;
  }

  // ── Admin atualiza qualquer usuario ─────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuario por ID (admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuario' })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já está em uso' })
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @Req() req: JwtRequest,
  ): Promise<UserResponseDto> {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const user = await this.usersService.update(id, dto);
    const { password: _p, reset_password_token: _rt, reset_password_expires: _re, ...safe } = user;
    return safe;
  }

  // ── Ativar / desativar (admin) ───────────────────────────────────────────

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Ativar ou desativar usuario (admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async toggle(@Param('id') id: string, @Req() req: JwtRequest): Promise<UserResponseDto> {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const user = await this.usersService.toggleActive(id);
    const { password: _p, reset_password_token: _rt, reset_password_expires: _re, ...safe } = user;
    return safe;
  }

  // ── Soft delete (admin) ──────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuario (soft delete, admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuario' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async remove(@Param('id') id: string, @Req() req: JwtRequest): Promise<{ message: string }> {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.usersService.softDelete(id);
    return { message: 'Usuário removido com sucesso' };
  }
}
