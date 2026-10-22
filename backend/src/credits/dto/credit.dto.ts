import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CreditStatus, CreditType } from '../entities/credit.entity';
import type { ModalidadAbono } from '../credit-math';

const MAX_MONEY = 1_000_000_000_000;

export class CreateCreditDto {
  @IsString() @Length(2, 120) nombre: string;
  @IsOptional() @IsString() @Length(2, 120) entidad?: string;
  @IsEnum(CreditType) tipo: CreditType;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(MAX_MONEY) montoOriginal: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(MAX_MONEY) saldoActual: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100, { message: 'La tasa E.A. debe estar entre 0 y 100' }) tasaEA: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(MAX_MONEY) cuotaMensual: number;
  @IsInt() @Min(1) @Max(600) cuotasRestantes: number;
}

export class UpdateCreditDto {
  @IsOptional() @IsString() @Length(2, 120) nombre?: string;
  @IsOptional() @IsString() @Length(2, 120) entidad?: string;
  @IsOptional() @IsEnum(CreditType) tipo?: CreditType;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(MAX_MONEY) saldoActual?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) tasaEA?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(MAX_MONEY) cuotaMensual?: number;
  @IsOptional() @IsInt() @Min(0) @Max(600) cuotasRestantes?: number;
  @IsOptional() @IsEnum(CreditStatus) estado?: CreditStatus;
}

export class EvaluateCreditDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(MAX_MONEY) monto: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) tasaEA: number;
  @IsInt() @Min(1) @Max(600) plazoMeses: number;
}

export class SimulateAbonoDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(MAX_MONEY) abono: number;
  @IsEnum(['reducir_plazo', 'reducir_cuota']) modalidad: ModalidadAbono;
}

export class SimulateCompraCarteraDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) tasaEANueva: number;
  @IsInt() @Min(1) @Max(600) plazoMesesNuevo: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(MAX_MONEY) gastosCierre?: number;
}
