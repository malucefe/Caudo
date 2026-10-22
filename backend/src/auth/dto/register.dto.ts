import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail({}, { message: 'Ingrese un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({ example: 'Password1!', minLength: 8 })
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

  @ApiProperty({
    example: true,
    description:
      'Aceptación de la política de tratamiento de datos personales (debe ser true)',
  })
  @IsBoolean({ message: 'La aceptación de la política debe ser verdadero o falso' })
  @Equals(true, {
    message: 'Debe aceptar la política de tratamiento de datos personales',
  })
  aceptaPolitica: boolean;
}
