import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FilesModule } from './files/files.module';
import { SeedModule } from './seed/seed.module';

import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Transaction } from './transactions/entities/transaction.entity';

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
        limit: 10,
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
        entities: [User, Category, Transaction],
        synchronize: configService.get('NODE_ENV') !== 'production',
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
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    FilesModule,
    SeedModule,
  ],
})
export class AppModule {}
