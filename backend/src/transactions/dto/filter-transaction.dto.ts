import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../entities/transaction.entity';

export class FilterTransactionsDto {
  @ApiPropertyOptional({ example: 1, description: 'Página actual' })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Elementos por página' })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: 'Filtrar por tipo de transacción',
  })
  @IsOptional()
  @IsEnum(TransactionType, { message: 'El tipo debe ser ingreso o egreso' })
  type?: TransactionType;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Fecha inicial del rango (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha inicial inválida (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description: 'Fecha final del rango (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha final inválida (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({
    example: '3f8e1c2a-9b4d-4e6a-8c1f-2d3e4f5a6b7c',
    description: 'Filtrar por categoría',
  })
  @IsOptional()
  @IsUUID('all', { message: 'categoryId debe ser un UUID válido' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 6, description: 'Mes (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  mes?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Año' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  anio?: number;
}
