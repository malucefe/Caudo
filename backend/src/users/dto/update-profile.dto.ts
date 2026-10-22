import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  nombre?: string;

  @ApiPropertyOptional({
    example: 3500000,
    description: 'Ingreso mensual de referencia en COP',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El ingreso mensual debe ser un número' })
  @Min(0, { message: 'El ingreso mensual no puede ser negativo' })
  @Max(1000000000000, { message: 'El ingreso mensual supera el valor permitido' })
  ingresoMensual?: number;
}
