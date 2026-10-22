import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategorizationService } from './categorization.service';
import { CategoriesController } from './categories.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), AiModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategorizationService],
  exports: [CategoriesService, CategorizationService],
})
export class CategoriesModule {}
