import { Module } from '@nestjs/common';
import { ExternalClientsController } from './external-clients.controller';
import { ExternalClientsService } from './external-clients.service';

@Module({
  controllers: [ExternalClientsController],
  providers: [ExternalClientsService],
})
export class ExternalClientsModule {}
