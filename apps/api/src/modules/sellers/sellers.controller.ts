import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateSellerDto,
  SellerLoginDto,
  SellersQueryDto,
  UpdateSellerDto,
} from './dto/sellers.dto';
import { SellersService } from './sellers.service';

@ApiTags('Sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createSellerDto: CreateSellerDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.sellersService.create(createSellerDto);
    return { ok: true, message: 'seller-created' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Query() query: SellersQueryDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    const sellers = await this.sellersService.findAll(query);
    return { ok: true, sellers };
  }

  @Post('login')
  async login(@Body() loginDto: SellerLoginDto, @Query() query: SellersQueryDto) {
    const seller = await this.sellersService.login(loginDto, query);
    return { ok: true, seller };
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    const seller = await this.sellersService.findOne(id);
    return { ok: true, seller };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateSellerDto: UpdateSellerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.sellersService.update(id, updateSellerDto);
    return { ok: true, message: 'seller-updated' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.sellersService.remove(id);
    return { ok: true, message: 'seller-deleted' };
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggle(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.sellersService.toggleActive(id);
    return { ok: true, message: 'seller-toggled' };
  }
}
