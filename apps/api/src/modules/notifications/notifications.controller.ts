import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma notificação (Apenas Admin)' })
  @ApiResponse({ status: 201, description: 'Notificação criada com sucesso' })
  async create(@Body() dto: CreateNotificationDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const notification = await this.notificationsService.create(dto);
    return { ok: true, message: 'notification-created', notification };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista notificações do usuário logado ou todas para admin' })
  async findAll(@Req() req: AuthenticatedRequest) {
    const notifications = await this.notificationsService.findAll(
      req.user.userId,
      req.user.type === 'admin',
    );
    return { ok: true, notifications };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca uma notificação por id' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const notification = await this.notificationsService.findOne(id);

    if (req.user.type !== 'admin' && notification.user_id !== req.user.userId) {
      throw new ForbiddenException('unauthorized');
    }

    return { ok: true, notification };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma notificação (Apenas Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const notification = await this.notificationsService.update(id, dto);
    return { ok: true, message: 'notification-updated', notification };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const notification = await this.notificationsService.markAsRead(
      id,
      req.user.userId,
      req.user.type === 'admin',
    );

    return { ok: true, message: 'notification-read', notification };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove uma notificação' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const notification = await this.notificationsService.remove(
      id,
      req.user.userId,
      req.user.type === 'admin',
    );

    return { ok: true, message: 'notification-deleted', notification };
  }
}
