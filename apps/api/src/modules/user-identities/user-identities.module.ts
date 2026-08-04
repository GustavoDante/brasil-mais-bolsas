import { Module } from '@nestjs/common';
import { UserIdentitiesController } from './user-identities.controller';
import { UserIdentitiesService } from './user-identities.service';

@Module({
  controllers: [UserIdentitiesController],
  providers: [UserIdentitiesService],
})
export class UserIdentitiesModule {}
