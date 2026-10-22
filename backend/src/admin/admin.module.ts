import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Goal } from '../goals/entities/goal.entity';
import { Credit } from '../credits/entities/credit.entity';
import { AiModule } from '../ai/ai.module';
import { AdminController } from './admin.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminMetricsService } from './admin-metrics.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Transaction, Budget, Goal, Credit]), AiModule],
  controllers: [AdminController],
  providers: [AdminUsersService, AdminCategoriesService, AdminMetricsService],
})
export class AdminModule {}
