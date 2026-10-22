import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryOrigin, TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: 'egreso' })
  @IsEnum(TransactionType, { message: 'El tipo debe ser ingreso o egreso' })
  tipo: TransactionType;

  @ApiProperty({ example: 50000, description: 'Monto en COP' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional({
    example: 'uuid-de-categoria',
    description:
      'Categoría de la transacción. Si se omite, el sistema la asigna automáticamente a partir de la descripción.',
  })
  @IsString()
  @IsNotEmpty({ message: 'La categoría no puede estar vacía' })
  @IsOptional()
  categoriaId?: string;

  @ApiPropertyOptional({
    enum: CategoryOrigin,
    description: 'automatica cuando el usuario aceptó la sugerencia del sistema',
  })
  @IsEnum(CategoryOrigin)
  @IsOptional()
  origenCategoria?: CategoryOrigin;

  @ApiPropertyOptional({ example: 'Almuerzo en restaurante' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString({}, { message: 'Ingrese una fecha válida (YYYY-MM-DD)' })
  fecha: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/uploads/recibo.jpg' })
  @IsString()
  @IsOptional()
  archivoUrl?: string;
}
