import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CategoriesModule, UsersModule],
  providers: [SeedService],
})
export class SeedModule {}
