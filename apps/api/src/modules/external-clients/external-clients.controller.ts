import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateExternalClientDto } from './dto/external-client.dto';
import { ExternalClientsService } from './external-clients.service';

@ApiTags('ExternalClients')
@Controller('external-clients')
export class ExternalClientsController {
  constructor(private readonly service: ExternalClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create external client' })
  async create(@Body() dto: CreateExternalClientDto) {
    const client = await this.service.create(dto);
    return { ok: true, client };
  }

  @Get()
  @ApiOperation({ summary: 'List external clients' })
  async findAll() {
    const clients = await this.service.findAll();
    return { ok: true, clients };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get external client' })
  async findOne(@Param('id') id: string) {
    const client = await this.service.findOne(id);
    return { ok: true, client };
  }
}
