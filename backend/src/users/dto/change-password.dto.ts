import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password1!' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  passwordActual: string;

  @ApiProperty({ example: 'NuevaPassword2@', minLength: 8 })
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  })
  passwordNueva: string;
}
