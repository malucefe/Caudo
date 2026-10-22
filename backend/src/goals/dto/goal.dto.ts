import { IsDateString, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @Length(2, 120)
  nombre: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'El monto objetivo debe ser mayor que cero' })
  @Max(1000000000000)
  montoObjetivo: number;

  @IsDateString({}, { message: 'fechaLimite debe tener formato AAAA-MM-DD' })
  fechaLimite: string;
}

export class UpdateGoalDto {
  @IsOptional() @IsString() @Length(2, 120) nombre?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(1000000000000) montoObjetivo?: number;
  @IsOptional() @IsDateString() fechaLimite?: string;
}

export class AddContributionDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'El aporte debe ser mayor que cero' })
  @Max(1000000000000)
  monto: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
