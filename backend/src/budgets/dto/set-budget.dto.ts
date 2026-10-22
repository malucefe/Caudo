import { IsInt, IsNumber, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SetBudgetDto {
  @IsUUID()
  categoriaId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'El tope debe ser mayor que cero' })
  @Max(1000000000000)
  montoLimite: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;
}
