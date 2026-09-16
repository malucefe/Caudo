import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  providers: [SeedService],
})
export class SeedModule {}
