import { Module } from '@nestjs/common';
import { IndicationsService } from './indications.service';
import { IndicationsController } from './indications.controller';

@Module({
  controllers: [IndicationsController],
  providers: [IndicationsService],
})
export class IndicationsModule {}
