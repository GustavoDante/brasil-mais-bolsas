import { Module } from '@nestjs/common';
import { MinorsController } from './minors.controller';
import { MinorsService } from './minors.service';

@Module({
  controllers: [MinorsController],
  providers: [MinorsService],
})
export class MinorsModule {}
