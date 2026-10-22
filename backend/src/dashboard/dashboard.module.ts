import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { GoalsModule } from '../goals/goals.module';
import { CreditsModule } from '../credits/credits.module';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [TransactionsModule, BudgetsModule, GoalsModule, CreditsModule, InsightsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
