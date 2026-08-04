import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSignedContractDto } from './dto/signed-contract.dto';
import { SignedContractsService } from './signed-contracts.service';

@ApiTags('SignedContracts')
@Controller('signed-contracts')
export class SignedContractsController {
  constructor(private readonly service: SignedContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Create signed contract' })
  async create(@Body() dto: CreateSignedContractDto) {
    const rec = await this.service.create(dto);
    return { ok: true, rec };
  }

  @Get()
  @ApiOperation({ summary: 'List signed contracts' })
  async findAll() {
    const items = await this.service.findAll();
    return { ok: true, items };
  }
}
