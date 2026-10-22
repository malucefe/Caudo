import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../users/entities/user.entity';
import { CategoryType } from '../../categories/entities/category.entity';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export class PageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;
}

export class ListUsersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nombre o correo' })
  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional() @IsEnum(UserRole)
  rol?: UserRole;

  @ApiPropertyOptional({ enum: ['activo', 'suspendido'] })
  @IsOptional() @IsIn(['activo', 'suspendido'])
  estado?: 'activo' | 'suspendido';
}

export class AuditQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por acción (contiene)' })
  @IsOptional() @IsString() @MaxLength(60)
  accion?: string;
}

export class CreateUserAdminDto {
  @ApiProperty() @IsString() @IsNotEmpty({ message: 'El nombre es requerido' }) @MaxLength(100)
  nombre: string;

  @ApiProperty() @IsEmail({}, { message: 'Ingrese un email válido' })
  email: string;

  @ApiProperty({ description: 'Contraseña temporal; el usuario puede cambiarla después' })
  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USUARIO })
  @IsOptional() @IsEnum(UserRole)
  rol?: UserRole;
}

export class UpdateUserAdminDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail({}, { message: 'Ingrese un email válido' })
  email?: string;

  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole)
  rol?: UserRole;
}

export class CreateCategoryDto {
  @ApiProperty() @IsString() @IsNotEmpty({ message: 'El nombre es requerido' }) @MaxLength(100)
  nombre: string;

  @ApiProperty({ enum: CategoryType }) @IsEnum(CategoryType)
  tipo: CategoryType;

  @ApiPropertyOptional({ example: '🍽️' }) @IsOptional() @IsString() @MaxLength(50)
  icono?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  icono?: string;
}
