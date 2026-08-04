import { Module } from '@nestjs/common';
import { PossiblePartnersController } from './possible-partners.controller';
import { PossiblePartnersService } from './possible-partners.service';

@Module({
  controllers: [PossiblePartnersController],
  providers: [PossiblePartnersService],
})
export class PossiblePartnersModule {}
