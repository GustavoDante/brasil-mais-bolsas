import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { CourseCategoriesController } from './course-categories.controller';
import { CourseCategoriesService } from './course-categories.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseCategoriesController],
  providers: [CourseCategoriesService],
  exports: [CourseCategoriesService],
})
export class CourseCategoriesModule {}
