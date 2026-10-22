import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_FILTER } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FilesModule } from './files/files.module';
import { SeedModule } from './seed/seed.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { CreditsModule } from './credits/credits.module';
import { InsightsModule } from './insights/insights.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AdminModule } from './admin/admin.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Budget } from './budgets/entities/budget.entity';
import { Goal } from './goals/entities/goal.entity';
import { GoalContribution } from './goals/entities/goal-contribution.entity';
import { Credit } from './credits/entities/credit.entity';
import { AuditLog } from './monitoring/entities/audit-log.entity';
import { ErrorLog } from './monitoring/entities/error-log.entity';
import { WebhookRun } from './monitoring/entities/webhook-run.entity';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting global
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Configuración de TypeORM con PostgreSQL (Supabase)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME', 'caudo'),
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [User, Category, Transaction, Budget, Goal, GoalContribution, Credit, AuditLog, ErrorLog, WebhookRun],
        // Desarrollo: synchronize. Producción: solo migraciones versionadas.
        synchronize: configService.get('NODE_ENV') !== 'production',
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        migrationsRun: configService.get('NODE_ENV') === 'production',
        logging: false,
      }),
      inject: [ConfigService],
    }),

    // Servir archivos estáticos (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Módulos de la aplicación
    MonitoringModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    FilesModule,
    BudgetsModule,
    GoalsModule,
    CreditsModule,
    InsightsModule,
    DashboardModule,
    AdminModule,
    SeedModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
