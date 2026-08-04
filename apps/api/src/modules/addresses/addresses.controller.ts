import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/address.dto';

@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly service: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create address' })
  async create(@Body() dto: CreateAddressDto) {
    const address = await this.service.create(dto);
    return { ok: true, address };
  }

  @Get()
  @ApiOperation({ summary: 'List addresses' })
  async findAll() {
    const addresses = await this.service.findAll();
    return { ok: true, addresses };
  }
}
