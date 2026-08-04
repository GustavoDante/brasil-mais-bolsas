import { Module } from '@nestjs/common';
import { SignedContractsController } from './signed-contracts.controller';
import { SignedContractsService } from './signed-contracts.service';

@Module({
  controllers: [SignedContractsController],
  providers: [SignedContractsService],
})
export class SignedContractsModule {}
